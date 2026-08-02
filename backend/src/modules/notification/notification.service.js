const {
  AppError,
  buildPaginationMeta,
  parsePagination,
  sanitizeUser
} = require("../../utils/helpers");
const { emitUserEvent } = require("../chat/socket");
const Notification = require("./notification.model");
const User = require("../user/user.model");

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

  let notification;
  if (payload.type === "follow" || payload.type === "follow_request") {
    notification = await Notification.findOneAndUpdate(
      {
        recipient: payload.recipient,
        actor: payload.actor,
        type: payload.type
      },
      {
        $set: {
          message: payload.message || "",
          entityId: payload.entityId,
          entityModel: payload.entityModel,
          isRead: false
        }
      },
      { upsert: true, new: true }
    );
  } else {
    notification = await Notification.create(payload);
  }

  const populatedNotification = await Notification.findById(notification._id)
    .populate("actor", "username fullName avatar role")
    .lean();

  const formattedNotification = formatNotification(populatedNotification);
  
  if (formattedNotification.actor) {
    const recipientUser = await User.findById(payload.recipient).select("following").lean();
    formattedNotification.actor.isFollowing = (recipientUser?.following || []).some(
      id => String(id) === String(formattedNotification.actor.id)
    );
  }

  emitUserEvent(payload.recipient, "notification:new", formattedNotification);

  return formattedNotification;
}

async function listNotifications(userId, query) {
  const { page, limit, skip } = parsePagination(query);
  const { type } = query;
  const filter = { recipient: userId };

  if (type && type !== "all") {
    filter.type = type;
  }

  const [notifications, total, unreadCount, currentUser] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("actor", "username fullName avatar role")
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: userId, isRead: false }),
    User.findById(userId).select("following").lean()
  ]);

  const followingIds = new Set((currentUser?.following || []).map(id => String(id)));

  return {
    items: notifications.map(notification => {
      const formatted = formatNotification(notification);
      if (formatted.actor) {
        formatted.actor.isFollowing = followingIds.has(String(formatted.actor.id));
      }
      return formatted;
    }),
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