const User = require("../user/user.model");
const { verifyToken } = require("../../utils/token");

let ioInstance = null;
const onlineUsers = new Map();

function addOnlineSocket(userId, socketId) {
  const sockets = onlineUsers.get(userId) || new Set();
  sockets.add(socketId);
  onlineUsers.set(userId, sockets);
}

function removeOnlineSocket(userId, socketId) {
  const sockets = onlineUsers.get(userId);

  if (!sockets) {
    return false;
  }

  sockets.delete(socketId);

  if (sockets.size === 0) {
    onlineUsers.delete(userId);
    return false;
  }

  return true;
}

async function setPresence(userId, isOnline) {
  try {
    await User.findByIdAndUpdate(userId, {
      isOnline,
      lastSeen: new Date()
    });
  } catch (error) {
    return null;
  }

  return null;
}

function emitUserEvent(userId, eventName, payload) {
  if (!ioInstance) {
    return;
  }

  ioInstance.to(`user:${userId}`).emit(eventName, payload);
}

function getOnlineUsers() {
  return Array.from(onlineUsers.keys());
}

function initChatSocket(io) {
  ioInstance = io;

  io.use((socket, next) => {
    try {
      const rawToken =
        socket.handshake.auth?.token || socket.handshake.headers?.authorization || "";
      const token = rawToken.startsWith("Bearer ") ? rawToken.slice(7) : rawToken;

      if (!token) {
        next(new Error("Authentication token is required"));
        return;
      }

      const decodedToken = verifyToken(token);
      socket.userId = String(decodedToken.sub);
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;

    addOnlineSocket(userId, socket.id);
    socket.join(`user:${userId}`);
    setPresence(userId, true);

    io.emit("presence:update", {
      userId,
      isOnline: true,
      onlineUserIds: getOnlineUsers()
    });

    socket.on("chat:typing", (payload) => {
      if (!payload?.toUserId) {
        return;
      }

      emitUserEvent(payload.toUserId, "chat:typing", {
        fromUserId: userId,
        isTyping: Boolean(payload.isTyping)
      });
    });

    socket.on("disconnect", () => {
      const isStillOnline = removeOnlineSocket(userId, socket.id);

      if (!isStillOnline) {
        setPresence(userId, false);
      }

      io.emit("presence:update", {
        userId,
        isOnline: isStillOnline,
        onlineUserIds: getOnlineUsers()
      });
    });
  });
}

module.exports = {
  emitUserEvent,
  getOnlineUsers,
  initChatSocket
};
