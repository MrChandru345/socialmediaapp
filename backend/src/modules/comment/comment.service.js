const { AppError, buildPaginationMeta, parsePagination, sanitizeUser } = require("../../utils/helpers");
const { createNotification } = require("../notification/notification.service");
const Post = require("../post/post.model");
const Comment = require("./comment.model");

function formatComment(comment, viewerId) {
  return {
    ...comment,
    id: String(comment._id),
    author: sanitizeUser(comment.author),
    likesCount: comment.likes?.length || 0,
    likedByViewer: viewerId
      ? comment.likes?.some((entry) => String(entry) === String(viewerId))
      : false
  };
}

async function listComments(postId, query, viewerId) {
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
    items: comments.map((comment) => formatComment(comment, viewerId)),
    meta: buildPaginationMeta(page, limit, total)
  };
}

async function addComment(userId, postId, payload) {
  const content = payload.content?.trim();

  if (!content) {
    throw new AppError(400, "Comment content is required");
  }

  // Try finding in Post first, then Reel
  const Reel = require("../reel/reel.model");
  let parent = await Post.findById(postId).select("author commentsCount");
  let modelName = "Post";

  if (!parent) {
    parent = await Reel.findById(postId).select("author commentsCount");
    modelName = "Reel";
  }

  if (!parent) {
    throw new AppError(404, "Content not found");
  }

  const comment = await Comment.create({
    post: postId,
    author: userId,
    content,
    parentComment: payload.parentCommentId || null
  });

  parent.commentsCount += 1;
  await parent.save();

  if (String(parent.author) !== String(userId)) {
    await createNotification({
      recipient: parent.author,
      actor: userId,
      type: "comment",
      entityId: parent._id,
      entityModel: modelName,
      message: `commented on your ${modelName.toLowerCase()}`
    });
  }

  const populatedComment = await Comment.findById(comment._id)
    .populate("author", "username fullName avatar role")
    .lean();

  return formatComment(populatedComment, userId);
}

async function deleteComment(userId, commentId, role) {
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new AppError(404, "Comment not found");
  }

  // Find post or reel to check if userId is post author
  const Reel = require("../reel/reel.model");
  let parent = await Post.findById(comment.post).select("author commentsCount");
  if (!parent) {
    parent = await Reel.findById(comment.post).select("author commentsCount");
  }

  const isCommentOwner = String(comment.author) === String(userId);
  const isPostAuthor = parent && String(parent.author) === String(userId);
  const isAdmin = role === "admin";

  if (!isCommentOwner && !isPostAuthor && !isAdmin) {
    throw new AppError(403, "You do not have permission to delete this comment");
  }

  if (parent) {
    parent.commentsCount = Math.max((parent.commentsCount || 1) - 1, 0);
    await parent.save();
  }

  await comment.deleteOne();
  return { id: String(commentId) };
}

async function toggleLike(commentId, userId) {
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new AppError(404, "Comment not found");
  }

  const isLiked = comment.likes.some((entry) => String(entry) === String(userId));

  if (isLiked) {
    comment.likes.pull(userId);
  } else {
    comment.likes.addToSet(userId);
  }

  await comment.save();

  if (!isLiked && String(comment.author) !== String(userId)) {
    await createNotification({
      recipient: comment.author,
      actor: userId,
      type: "like",
      entityId: comment._id,
      entityModel: "Comment",
      message: "liked your comment"
    });
  }

  return {
    liked: !isLiked,
    likesCount: comment.likes.length
  };
}

module.exports = {
  addComment,
  deleteComment,
  listComments,
  toggleLike
};
