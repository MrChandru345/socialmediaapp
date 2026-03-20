const { asyncHandler } = require("../../middleware/error.middleware");
const { addComment, deleteComment, listComments } = require("./comment.service");

const getCommentsForPost = asyncHandler(async (req, res) => {
  const comments = await listComments(req.params.postId, req.query);

  res.json({
    success: true,
    data: comments
  });
});

const createComment = asyncHandler(async (req, res) => {
  const comment = await addComment(req.user._id, req.params.postId, req.body);

  res.status(201).json({
    success: true,
    message: "Comment added successfully",
    data: comment
  });
});

const removeComment = asyncHandler(async (req, res) => {
  const result = await deleteComment(req.user._id, req.params.commentId, req.user.role);

  res.json({
    success: true,
    message: "Comment deleted successfully",
    data: result
  });
});

module.exports = {
  createComment,
  getCommentsForPost,
  removeComment
};
