const { AppError, sanitizeUser } = require("../../utils/helpers");
const Message = require("../chat/message.model");
const Comment = require("../comment/comment.model");
const Notification = require("../notification/notification.model");
const Post = require("../post/post.model");
const Reel = require("../reel/reel.model");
const Story = require("../story/story.model");
const User = require("../user/user.model");

async function getDashboardStats() {
  const [users, posts, comments, messages, stories, reels, notifications] = await Promise.all([
    User.countDocuments({}),
    Post.countDocuments({}),
    Comment.countDocuments({}),
    Message.countDocuments({}),
    Story.countDocuments({}),
    Reel.countDocuments({}),
    Notification.countDocuments({})
  ]);

  return {
    users,
    posts,
    comments,
    messages,
    stories,
    reels,
    notifications
  };
}

async function listUsers(query) {
  const normalizedQuery = query?.trim();
  const filter = normalizedQuery
    ? {
        $or: [
          { username: new RegExp(normalizedQuery, "i") },
          { email: new RegExp(normalizedQuery, "i") },
          { fullName: new RegExp(normalizedQuery, "i") }
        ]
      }
    : {};

  const users = await User.find(filter)
    .select("username email fullName avatar role followers following createdAt")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return users.map((user) => ({
    ...sanitizeUser(user),
    followersCount: user.followers?.length || 0,
    followingCount: user.following?.length || 0
  }));
}

async function removePost(postId) {
  const post = await Post.findById(postId);

  if (!post) {
    throw new AppError(404, "Post not found");
  }

  await Post.deleteOne({ _id: postId });

  return {
    deleted: true,
    postId
  };
}

module.exports = {
  getDashboardStats,
  listUsers,
  removePost
};
