const { AppError, buildPaginationMeta, parsePagination, sanitizeUser } = require("../../utils/helpers");
const { createNotification } = require("../notification/notification.service");
const Post = require("../post/post.model");
const Comment = require("./comment.model");

function formatComment(comment) {
  return {
    ...comment,
    id: String(comment._id),
    author: sanitizeUser(comment.author)
  };
}

async function listComments(postId, query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { post: postId };

  const [comments, total] = await Promise.all([
    Comment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "username fullName avatar role")
      .lean(),
    Comment.countDocuments(filter)
  ]);

  return {
    items: comments.map(formatComment),
    meta: buildPaginationMeta(page, limit, total)
  };
}

async function addComment(userId, postId, payload) {
  const content = payload.content?.trim();

  if (!content) {
    throw new AppError(400, "Comment content is required");
  }

  const post = await Post.findById(postId).select("author commentsCount");

  if (!post) {
    throw new AppError(404, "Post not found");
  }

  const comment = await Comment.create({
    post: postId,
    author: userId,
    content,
    parentComment: payload.parentCommentId || null
  });

  post.commentsCount += 1;
  await post.save();

  if (String(post.author) !== String(userId)) {
    await createNotification({
      recipient: post.author,
      actor: userId,
      type: "comment",
      entityId: post._id,
      entityModel: "Post",
      message: "commented on your post"
    });
  }

  const populatedComment = await Comment.findById(comment._id)
    .populate("author", "username fullName avatar role")
    .lean();

  return formatComment(populatedComment);
}

async function deleteComment(userId, commentId, role) {
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new AppError(404, "Comment not found");
  }

  const isOwner = String(comment.author) === String(userId);
  const isAdmin = role === "admin";

  if (!isOwner && !isAdmin) {
    throw new AppError(403, "You do not have permission to delete this comment");
  }

  await Promise.all([
    Comment.deleteOne({ _id: commentId }),
    Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } })
  ]);

  return {
    deleted: true,
    commentId
  };
}

module.exports = {
  addComment,
  deleteComment,
  listComments
};
