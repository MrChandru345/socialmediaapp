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
  const messages = await Message.find({ participants: userId })
    .sort({ createdAt: -1 })
    .populate("sender", "username fullName avatar role isOnline lastSeen")
    .populate("receiver", "username fullName avatar role isOnline lastSeen")
    .lean();

  const conversations = new Map();

  messages.forEach((message) => {
    const senderId = String(message.sender._id);
    const receiverId = String(message.receiver._id);
    const otherUser = senderId === String(userId) ? message.receiver : message.sender;
    const otherUserId = String(otherUser._id);

    if (!conversations.has(otherUserId)) {
      conversations.set(otherUserId, {
        otherUser: formatChatUser(otherUser),
        lastMessage: formatMessage(message),
        unreadCount: 0
      });
    }

    if (receiverId === String(userId) && !message.seenAt) {
      conversations.get(otherUserId).unreadCount += 1;
    }
  });

  return {
    items: Array.from(conversations.values()),
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
