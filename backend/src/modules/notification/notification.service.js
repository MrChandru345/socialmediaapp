const {
  AppError,
  buildPaginationMeta,
  parsePagination,
  sanitizeUser
} = require("../../utils/helpers");
const { emitUserEvent } = require("../chat/socket");
const Notification = require("./notification.model");

function formatNotification(notification) {
  return {
    ...notification,
    id: String(notification._id),
    actor: sanitizeUser(notification.actor)
  };
}

async function createNotification(payload) {
  if (String(payload.recipient) === String(payload.actor)) {
    return null;
  }

  const notification = await Notification.create(payload);
  const populatedNotification = await Notification.findById(notification._id)
    .populate("actor", "username fullName avatar role")
    .lean();

  const formattedNotification = formatNotification(populatedNotification);
  emitUserEvent(payload.recipient, "notification:new", formattedNotification);

  return formattedNotification;
}

async function listNotifications(userId, query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { recipient: userId };

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("actor", "username fullName avatar role")
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: userId, isRead: false })
  ]);

  return {
    items: notifications.map(formatNotification),
    meta: buildPaginationMeta(page, limit, total),
    unreadCount
  };
}

async function markNotificationRead(userId, notificationId) {
  const notification = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      recipient: userId
    },
    {
      $set: { isRead: true }
    },
    {
      new: true
    }
  )
    .populate("actor", "username fullName avatar role")
    .lean();

  if (!notification) {
    throw new AppError(404, "Notification not found");
  }

  return formatNotification(notification);
}

async function markAllNotificationsRead(userId) {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true } }
  );

  return {
    updated: true,
    updatedCount: result.modifiedCount || 0
  };
}

module.exports = {
  createNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead
};