const { asyncHandler } = require("../../middleware/error.middleware");
const {
  getConversation,
  listConversations,
  markConversationSeen,
  sendMessage
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
  const message = await sendMessage(req.user._id, req.params.receiverId, req.body);

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

module.exports = {
  createMessage,
  getConversationList,
  getMessages,
  markSeen
};
