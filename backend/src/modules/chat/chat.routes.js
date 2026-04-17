const express = require("express");

const { protect } = require("../../middleware/auth.middleware");
const { upload } = require("../../middleware/upload.middleware");
const {
  createMessage,
  getConversationList,
  getMessages,
  markSeen,
  removeMessage,
  fetchNotes,
  addNote,
  removeNote,
  getUnreadCount,
  reactToMessage,
  removeConversation
} = require("./chat.controller");

const router = express.Router();

router.use(protect);
router.get("/notes/all", fetchNotes);
router.post("/notes", addNote);
router.delete("/notes/:id", removeNote);

router.get("/unread-count", getUnreadCount);
router.get("/conversations", getConversationList);
router.delete("/conversations/:withUserId", removeConversation);
router.get("/:withUserId", getMessages);
router.post("/:receiverId", upload.array("attachments", 10), createMessage);
router.patch("/:withUserId/seen", markSeen);
router.post("/message/:messageId/react", reactToMessage);
router.delete("/message/:messageId", removeMessage);

module.exports = router;
