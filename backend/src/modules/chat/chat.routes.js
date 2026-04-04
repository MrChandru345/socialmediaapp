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
  removeNote
} = require("./chat.controller");

const router = express.Router();

router.use(protect);
router.get("/notes/all", fetchNotes);
router.post("/notes", addNote);
router.delete("/notes/:id", removeNote);

router.get("/conversations", getConversationList);
router.get("/:withUserId", getMessages);
router.post("/:receiverId", upload.array("attachments", 10), createMessage);
router.patch("/:withUserId/seen", markSeen);

module.exports = router;
