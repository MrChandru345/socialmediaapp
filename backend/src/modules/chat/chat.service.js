const mongoose = require("mongoose");
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

function formatChatUser(user) {
  const sanitized = sanitizeUser(user);

  if (!sanitized) {
    return null;
  }

  return {
    id: sanitized.id,
    _id: sanitized._id,
    username: sanitized.username,
    fullName: sanitized.fullName,
    avatar: sanitized.avatar,
    role: sanitized.role,
    isOnline: sanitized.isOnline,
    lastSeen: sanitized.lastSeen
  };
}

function formatMessage(message) {
  return {
    ...message,
    id: String(message._id),
    sender: formatChatUser(message.sender),
    receiver: formatChatUser(message.receiver)
  };
}

async function listConversations(userId) {
  const conversations = await Message.aggregate([
    {
      $match: {
        participants: new mongoose.Types.ObjectId(userId)
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
                  { $eq: ["$seenAt", null] }
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

async function getConversation(userId, withUserId, query) {
  const { limit, skip } = parsePagination(query);
  const roomId = buildRoomId(userId, withUserId);

  const messages = await Message.find({ roomId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("sender", "username fullName avatar role isOnline lastSeen")
    .populate("receiver", "username fullName avatar role isOnline lastSeen")
    .lean();

  return {
    items: messages.reverse().map(formatMessage)
  };
}

async function sendMessage(userId, receiverId, payload) {
  if (String(userId) === String(receiverId)) {
    throw new AppError(400, "You cannot send a direct message to yourself");
  }

  const receiver = await User.findById(receiverId).select("_id");

  if (!receiver) {
    throw new AppError(404, "Receiver not found");
  }

  const body = payload.body?.trim() || "";
  const attachments = normalizeMediaInput(payload.attachments);

  if (!body && attachments.length === 0) {
    throw new AppError(400, "A message body or attachment is required");
  }

  const message = await Message.create({
    roomId: buildRoomId(userId, receiverId),
    participants: [userId, receiverId],
    sender: userId,
    receiver: receiverId,
    body,
    attachments
  });

  const populatedMessage = await Message.findById(message._id)
    .populate("sender", "username fullName avatar role isOnline lastSeen")
    .populate("receiver", "username fullName avatar role isOnline lastSeen")
    .lean();

  const formattedMessage = formatMessage(populatedMessage);

  emitUserEvent(receiverId, "chat:message", formattedMessage);
  emitUserEvent(userId, "chat:message", formattedMessage);

  await createNotification({
    recipient: receiverId,
    actor: userId,
    type: "message",
    entityId: message._id,
    entityModel: "Message",
    message: body ? "sent you a message" : "shared an attachment with you"
  });

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

  return {
    updatedCount: result.modifiedCount
  };
}

module.exports = {
  getConversation,
  listConversations,
  markConversationSeen,
  sendMessage
};
