const { asyncHandler } = require("../../middleware/error.middleware");
const {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead
} = require("./notification.service");

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await listNotifications(req.user._id, req.query);

  res.json({
    success: true,
    data: notifications
  });
});

const readNotification = asyncHandler(async (req, res) => {
  const notification = await markNotificationRead(req.user._id, req.params.notificationId);

  res.json({
    success: true,
    data: notification
  });
});

const readAllNotifications = asyncHandler(async (req, res) => {
  const result = await markAllNotificationsRead(req.user._id);

  res.json({
    success: true,
    data: result
  });
});

module.exports = {
  getNotifications,
  readAllNotifications,
  readNotification
};
