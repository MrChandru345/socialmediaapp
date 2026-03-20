const express = require("express");

const { protect } = require("../../middleware/auth.middleware");
const {
  getNotifications,
  readAllNotifications,
  readNotification
} = require("./notification.controller");

const router = express.Router();

router.use(protect);
router.get("/", getNotifications);
router.patch("/read-all", readAllNotifications);
router.patch("/:notificationId/read", readNotification);

module.exports = router;
