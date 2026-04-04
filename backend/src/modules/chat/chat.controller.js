const { asyncHandler } = require("../../middleware/error.middleware");
const {
  getConversation,
  listConversations,
  markConversationSeen,
  sendMessage,
  deleteMessage,
  createNote,
  getActiveNotes,
  deleteNote,
  getTotalUnreadCount,
  toggleMessageReaction,
  clearConversation
} = require("./chat.service");

const getConversationList = asyncHandler(async (req, res) => {
  const conversations = await listConversations(req.user._id);

  res.json({
    success: true,
    data: conversations
  });
});

const getMessages = asyncHandler(async (req, res) => {
  const conversation = await getConversation(req.user._id, req.params.withUserId, req.query);

  res.json({
    success: true,
    data: conversation
  });
});

const createMessage = asyncHandler(async (req, res) => {
  const message = await sendMessage(req.user._id, req.params.receiverId, req.body, req.files);

  res.status(201).json({
    success: true,
    message: "Message sent successfully",
    data: message
  });
});

const markSeen = asyncHandler(async (req, res) => {
  const result = await markConversationSeen(req.user._id, req.params.withUserId);

  res.json({
    success: true,
    data: result
  });
});

const removeMessage = asyncHandler(async (req, res) => {
  const { action } = req.body;
  const result = await deleteMessage(req.user._id, req.params.messageId, action);
  
  res.json({
    success: true,
    data: result
  });
});

const addNote = asyncHandler(async (req, res) => {
  const note = await createNote(req.user._id, req.body.body);
  res.status(201).json({ success: true, data: note });
});

const fetchNotes = asyncHandler(async (req, res) => {
  const notes = await getActiveNotes(req.user._id);
  res.json({ success: true, data: notes });
});

const removeNote = asyncHandler(async (req, res) => {
  await deleteNote(req.user._id, req.params.id);
  res.json({ success: true, message: "Note deleted" });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await getTotalUnreadCount(req.user._id);
  res.json({ success: true, data: count });
});

const reactToMessage = asyncHandler(async (req, res) => {
  const { emoji } = req.body;
  const reactions = await toggleMessageReaction(req.user._id, req.params.messageId, emoji);
  res.json({ success: true, data: reactions });
});

const removeConversation = asyncHandler(async (req, res) => {
  const result = await clearConversation(req.user._id, req.params.withUserId);
  res.json({ success: true, data: result });
});

module.exports = {
  createMessage,
  getConversationList,
  getMessages,
  markSeen,
  removeMessage,
  addNote,
  fetchNotes,
  removeNote,
  getUnreadCount,
  reactToMessage,
  removeConversation
};
