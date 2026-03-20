const express = require("express");

const { protect } = require("../../middleware/auth.middleware");
const {
  createMessage,
  getConversationList,
  getMessages,
  markSeen
} = require("./chat.controller");

const router = express.Router();

router.use(protect);
router.get("/conversations", getConversationList);
router.get("/:withUserId", getMessages);
router.post("/:receiverId", createMessage);
router.patch("/:withUserId/seen", markSeen);

module.exports = router;
