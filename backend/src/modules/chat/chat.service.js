const mongoose = require("mongoose");
const { isCloudinaryConfigured, uploadBuffer } = require("../../config/cloudinary");
const {
  AppError,
  buildRoomId,
  normalizeMediaInput,
  parsePagination,
  sanitizeUser
} = require("../../utils/helpers");
const { emitUserEvent, getOnlineUsers } = require("./socket");
const { createNotification } = require("../notification/notification.service");
const User = require("../user/user.model");
const Message = require("./message.model");
const Note = require("./note.model");

function formatChatUser(user) {
  const sanitized = sanitizeUser(user);
  if (!sanitized) return null;

  return {
    id: sanitized.id,
    _id: sanitized._id,
    username: sanitized.username,
    fullName: sanitized.fullName,
    avatar: sanitized.avatar,
    role: sanitized.role,
    isOnline: getOnlineUsers().includes(sanitized.id),
    lastSeen: sanitized.lastSeen,
    createdAt: sanitized.createdAt
  };
}

async function uploadMediaFiles(files, folder) {
  if (!files?.length) {
    return [];
  }

  if (!isCloudinaryConfigured) {
    throw new AppError(400, "Cloudinary must be configured before uploading files");
  }

  return Promise.all(
    files.map(async (file) => {
      // Chrome/Firefox often use video/webm for audio-only recordings
      const isAudio = file.mimetype.startsWith("audio/") || 
                     (file.mimetype === "video/webm" && file.originalname.includes("voice-"));
      const isVideo = file.mimetype.startsWith("video/") && !isAudio;
      
      const resourceType = (isVideo || isAudio) ? "video" : "image";
      
      const result = await uploadBuffer(file.buffer, {
        folder,
        resource_type: resourceType,
        public_id: `file_${Date.now()}`
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        type: isAudio ? "audio" : resourceType
      };
    })
  );
}


function formatMessage(message) {
  const formatted = {
    ...message,
    id: String(message._id),
    sender: formatChatUser(message.sender),
    receiver: formatChatUser(message.receiver)
  };

  if (message.replyTo && typeof message.replyTo === "object" && message.replyTo._id) {
    formatted.replyTo = {
      id: String(message.replyTo._id),
      body: message.replyTo.body,
      sender: formatChatUser(message.replyTo.sender)
    };
  }

  // Handle populated shared post natively
  if (message.sharedPost && typeof message.sharedPost === "object") {
    const media = Array.isArray(message.sharedPost.media) 
      ? message.sharedPost.media[0] 
      : message.sharedPost.media;
    formatted.sharedPost = {
      ...message.sharedPost,
      id: String(message.sharedPost._id),
      author: message.sharedPost.author ? formatChatUser(message.sharedPost.author) : null,
      media: Array.isArray(message.sharedPost.media) ? message.sharedPost.media : [message.sharedPost.media]
    };
  } else if (message.sharedPost) {
    formatted.sharedPost = String(message.sharedPost);
  }

  return formatted;
}

async function listConversations(userId) {
  const conversations = await Message.aggregate([
    {
      $match: {
        participants: new mongoose.Types.ObjectId(userId),
        deletedFor: { $ne: new mongoose.Types.ObjectId(userId) }
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: "$roomId",
        lastMessage: { $first: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$receiver", new mongoose.Types.ObjectId(userId)] },
                  { $eq: ["$seenAt", null] },
                  { $not: { $in: [new mongoose.Types.ObjectId(userId), "$deletedFor"] } }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "lastMessage.participants",
        foreignField: "_id",
        as: "participantsInfo"
      }
    },
    {
      $project: {
        roomId: "$_id",
        lastMessage: 1,
        unreadCount: 1,
        otherUser: {
          $arrayElemAt: [
            {
              $filter: {
                input: "$participantsInfo",
                as: "p",
                cond: { $ne: ["$$p._id", new mongoose.Types.ObjectId(userId)] }
              }
            },
            0
          ]
        }
      }
    },
    {
      $sort: { "lastMessage.createdAt": -1 }
    }
  ]);

  const items = conversations.map((conv) => ({
    roomId: conv.roomId,
    otherUser: formatChatUser(conv.otherUser),
    lastMessage: formatMessage(conv.lastMessage),
    unreadCount: conv.unreadCount
  }));

  return {
    items,
    onlineUserIds: getOnlineUsers()
  };
}

async function getTotalUnreadCount(userId) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  return await Message.countDocuments({
    receiver: userObjectId,
    seenAt: null,
    deletedFor: { $ne: userObjectId }
  });
}

async function clearConversation(userId, withUserId) {
  try {
    if (!userId || !withUserId) {
      throw new AppError(400, "Missing required user IDs for deletion");
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(withUserId)) {
      throw new AppError(400, "Invalid user ID format provided for deletion");
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const withUserObjectId = new mongoose.Types.ObjectId(withUserId);
    const roomId = buildRoomId(userId, withUserId);
    
    console.log(`[ChatService] Robust Deletion: Room ${roomId} | Users ${userId}, ${withUserId}`);

    // Mark all existing messages as deleted for this user
    const result = await Message.updateMany(
      { 
        $or: [
          { roomId },
          { participants: { $all: [userObjectId, withUserObjectId] } }
        ],
        deletedFor: { $ne: userObjectId } 
      },
      { $addToSet: { deletedFor: userObjectId } }
    );

    console.log(`[ChatService] Successfully marked ${result.modifiedCount} messages as deleted`);
    return { success: true, count: result.modifiedCount || 0 };
  } catch (error) {
    console.error("[ChatService] Error in clearConversation:", error);
    throw error;
  }
}

async function getConversation(userId, withUserId, query) {
  // Use a much larger default limit (500 instead of 10) for fetching messages
  const { limit, skip } = parsePagination({ limit: 500, ...query });
  const roomId = buildRoomId(userId, withUserId);

  const messages = await Message.find({ 
    roomId,
    deletedFor: { $ne: userId }
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("sender", "username fullName avatar role isOnline lastSeen")
    .populate("receiver", "username fullName avatar role isOnline lastSeen")
    .populate({
      path: "replyTo",
      populate: { path: "sender", select: "username fullName avatar" }
    })
    .populate({
      path: "sharedPost",
      populate: { path: "author", select: "username fullName avatar" }
    })
    .lean();

  return {
    items: messages.reverse().map(formatMessage)
  };
}

async function sendMessage(userId, receiverId, payload, files) {
  if (String(userId) === String(receiverId)) {
    throw new AppError(400, "You cannot send a direct message to yourself");
  }

  const receiver = await User.findById(receiverId).select("_id");

  if (!receiver) {
    throw new AppError(404, "Receiver not found");
  }

  const body = payload.body?.trim() || "";
  const payloadMedia = normalizeMediaInput(payload.attachments);
  const uploadedMedia = await uploadMediaFiles(files, "socialmediaapp/chat");
  const attachments = [...payloadMedia, ...uploadedMedia];

  if (!body && attachments.length === 0 && !payload.sharedPost) {
    throw new AppError(400, "A message body, attachment, or shared post is required");
  }

  const replyTo = payload.replyTo || null;
  const sharedPost = payload.sharedPost || null;

  const message = await Message.create({
    roomId: buildRoomId(userId, receiverId),
    participants: [userId, receiverId],
    sender: userId,
    receiver: receiverId,
    body,
    attachments,
    replyTo,
    sharedPost
  });

  const populatedMessage = await Message.findById(message._id)
    .populate("sender", "username fullName avatar role isOnline lastSeen")
    .populate("receiver", "username fullName avatar role isOnline lastSeen")
    .populate({
      path: "replyTo",
      populate: { path: "sender", select: "username fullName avatar" }
    })
    .populate({
      path: "sharedPost",
      populate: { path: "author", select: "username fullName avatar" }
    })
    .lean();

  const formattedMessage = formatMessage(populatedMessage);

  emitUserEvent(receiverId, "chat:message", formattedMessage);
  emitUserEvent(userId, "chat:message", formattedMessage);

  return formattedMessage;
}

async function markConversationSeen(userId, withUserId) {
  const roomId = buildRoomId(userId, withUserId);

  const result = await Message.updateMany(
    {
      roomId,
      receiver: userId,
      seenAt: null
    },
    {
      $set: { seenAt: new Date() }
    }
  );

  emitUserEvent(withUserId, "chat:seen", {
    byUserId: String(userId),
    roomId
  });

  // Also emit to the current user to sync all their open tabs
  emitUserEvent(userId, "chat:seen", {
    byUserId: String(userId),
    roomId
  });

  return {
    updatedCount: result.modifiedCount
  };
}

async function toggleMessageReaction(userId, messageId, emoji) {
  const message = await Message.findById(messageId);
  if (!message) {
    const { AppError } = require("../../middleware/error.middleware");
    throw new AppError(404, "Message not found");
  }

  const existingReactionIndex = message.reactions.findIndex(
    (r) => String(r.user) === String(userId)
  );

  if (existingReactionIndex !== -1) {
    if (message.reactions[existingReactionIndex].emoji === emoji) {
      // Remove same emoji
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Switch emoji
      message.reactions[existingReactionIndex].emoji = emoji;
    }
  } else {
    // Add new
    message.reactions.push({ user: userId, emoji });
  }

  await message.save();
  
  const reactionData = {
    messageId: String(message._id),
    roomId: message.roomId,
    reactions: message.reactions
  };

  const recipientId = String(message.receiver) === String(userId) ? String(message.sender) : String(message.receiver);
  emitUserEvent(recipientId, "chat:reaction_update", reactionData);
  emitUserEvent(userId, "chat:reaction_update", reactionData);

  return message.reactions;
}

async function deleteMessage(userId, messageId, action) {
  const message = await Message.findById(messageId);
  
  if (!message) {
    throw new AppError(404, "Message not found");
  }

  const isParticipant = message.participants.some(p => String(p) === String(userId));
  if (!isParticipant) {
    throw new AppError(403, "Not authorized to modify this message");
  }

  if (action === "delete_for_me") {
    if (!message.deletedFor.includes(userId)) {
      message.deletedFor.push(userId);
      await message.save();
    }
    return { success: true, messageId: String(message._id), action: "delete_for_me" };
  } else if (action === "unsend" || action === "delete_for_everyone") {
    if (String(message.sender) !== String(userId)) {
      throw new AppError(403, "You can only unsend your own messages");
    }
    
    await Message.deleteOne({ _id: messageId });
    
    const receiverId = String(message.receiver) === String(userId) ? String(message.sender) : String(message.receiver);
    emitUserEvent(receiverId, "chat:message_deleted", { messageId: String(message._id), roomId: message.roomId });
    emitUserEvent(userId, "chat:message_deleted", { messageId: String(message._id), roomId: message.roomId });

    return { success: true, messageId: String(message._id), action: "unsend" };
  } else {
    throw new AppError(400, "Invalid delete action");
  }
}

async function createNote(userId, body) {
  // Upsert note for this user (one user, one note)
  await Note.findOneAndUpdate(
    { user: userId },
    { body, createdAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  
  // Now fetch and populate to ensure a clean result
  return await Note.findOne({ user: userId }).populate("user", "username fullName avatar");
}

async function getActiveNotes(userId) {
  // Get all relevant notes for users in conversations
  const conversations = await Message.find({ participants: userId })
    .distinct("participants");
  
  const relevantUserIds = conversations.filter(id => String(id) !== String(userId));
  relevantUserIds.push(userId);

  const notes = await Note.find({ user: { $in: relevantUserIds } })
    .populate("user", "username fullName avatar isOnline")
    .sort({ createdAt: -1 })
    .lean();

  const onlineUserIds = getOnlineUsers();
  return notes.map(note => {
    if (note.user) {
      note.user.isOnline = onlineUserIds.includes(String(note.user._id));
    }
    return note;
  });
}

async function deleteNote(userId, noteId) {
  const note = await Note.findOne({ _id: noteId, user: userId });
  if (!note) throw new AppError(404, "Note not found");
  
  await note.deleteOne();
  return { success: true };
}

module.exports = {
  deleteMessage,
  getConversation,
  listConversations,
  markConversationSeen,
  sendMessage,
  createNote,
  getActiveNotes,
  deleteNote,
  uploadMediaFiles,
  getTotalUnreadCount,
  toggleMessageReaction,
  clearConversation
};
