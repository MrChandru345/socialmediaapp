const Post = require("../post/post.model");
const User = require("./user.model");
const { isCloudinaryConfigured, uploadBuffer } = require("../../config/cloudinary");
const {
  AppError,
  buildPaginationMeta,
  isValidObjectId,
  parsePagination,
  sanitizeUser
} = require("../../utils/helpers");

function sanitizeProfile(user, viewerId, postCount) {
  const sanitized = sanitizeUser(user);

  return {
    ...sanitized,
    followersCount: user.followers?.length || 0,
    followingCount: user.following?.length || 0,
    postCount,
    isFollowing: viewerId
      ? user.followers?.some((entry) => String(entry) === String(viewerId))
      : false
  };
}

function formatProfilePostAuthor(author) {
  const user = sanitizeUser(author);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    _id: user._id,
    username: user.username,
    fullName: user.fullName,
    avatar: user.avatar,
    location: user.location,
    role: user.role
  };
}

function formatProfilePost(post, viewerId) {
  return {
    ...post,
    id: String(post._id),
    author: formatProfilePostAuthor(post.author),
    commentsCount: post.commentsCount || 0,
    likesCount: post.likes?.length || 0,
    savesCount: post.saves?.length || 0,
    likedByViewer: viewerId
      ? post.likes?.some((entry) => String(entry) === String(viewerId))
      : false,
    savedByViewer: viewerId
      ? post.saves?.some((entry) => String(entry) === String(viewerId))
      : false
  };
}

function buildProfileQuery(identifier) {
  return isValidObjectId(identifier)
    ? { _id: identifier }
    : { username: identifier.trim().toLowerCase() };
}

async function findProfileUser(identifier) {
  const user = await User.findOne(buildProfileQuery(identifier)).select("-password").lean();

  if (!user) {
    throw new AppError(404, "User profile not found");
  }

  return user;
}

async function getProfile(identifier, viewerId) {
  const user = await findProfileUser(identifier);
  const postCount = await Post.countDocuments({ author: user._id });
  return sanitizeProfile(user, viewerId, postCount);
}

async function getProfilePosts(identifier, viewerId, query) {
  const user = await findProfileUser(identifier);
  const { page, limit, skip } = parsePagination(query);
  const isOwner = viewerId && String(user._id) === String(viewerId);
  const isFollower = viewerId
    ? user.followers?.some((entry) => String(entry) === String(viewerId))
    : false;
  const filter = {
    author: user._id
  };

  if (!isOwner && !isFollower) {
    filter.visibility = "public";
  }

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "username fullName avatar location role")
      .lean(),
    Post.countDocuments(filter)
  ]);

  return {
    items: posts.map((post) => formatProfilePost(post, viewerId)),
    meta: buildPaginationMeta(page, limit, total)
  };
}

async function uploadAvatar(file) {
  if (!file) {
    return null;
  }

  if (!isCloudinaryConfigured) {
    throw new AppError(400, "Cloudinary must be configured before uploading files");
  }

  const result = await uploadBuffer(file.buffer, {
    folder: "socialmediaapp/avatars",
    resource_type: "image"
  });

  return {
    url: result.secure_url,
    publicId: result.public_id
  };
}

async function updateProfile(userId, payload, file) {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (payload.username !== undefined) {
    const desiredName = payload.username.trim().toLowerCase();
    if (desiredName && desiredName !== user.username) {
      const existing = await User.findOne({ username: desiredName });
      if (existing) throw new AppError(400, "Username is already taken");
      user.username = desiredName;
    }
  }

  if (payload.fullName !== undefined) {
    user.fullName = payload.fullName.trim();
  }

  if (payload.bio !== undefined) {
    user.bio = payload.bio.trim();
  }

  if (payload.website !== undefined) {
    user.website = payload.website.trim();
  }

  if (payload.location !== undefined) {
    user.location = payload.location.trim();
  }

  if (payload.avatarUrl) {
    user.avatar = {
      url: payload.avatarUrl,
      publicId: payload.avatarPublicId || ""
    };
  }

  const uploadedAvatar = await uploadAvatar(file);
  if (uploadedAvatar) {
    user.avatar = uploadedAvatar;
  }

  await user.save();

  const postCount = await Post.countDocuments({ author: user._id });
  return sanitizeProfile(user, user._id, postCount);
}

async function searchUsers(query, viewerId) {
  const normalizedQuery = query?.trim();

  if (!normalizedQuery) {
    return [];
  }

  const searchRegex = new RegExp(normalizedQuery, "i");
  const users = await User.find({
    $or: [{ username: searchRegex }, { fullName: searchRegex }]
  })
    .select("username fullName avatar bio role followers following")
    .limit(12)
    .lean();

  return users.map((user) => ({
    ...sanitizeUser(user),
    followersCount: user.followers?.length || 0,
    followingCount: user.following?.length || 0,
    isFollowing: viewerId
      ? user.followers?.some((entry) => String(entry) === String(viewerId))
      : false
  }));
}

async function getSuggestions(userId) {
  const currentUser = await User.findById(userId).select("following").lean();

  if (!currentUser) {
    throw new AppError(404, "User not found");
  }

  const excludedIds = [userId, ...(currentUser.following || [])];
  const users = await User.find({
    _id: { $nin: excludedIds }
  })
    .select("username fullName avatar bio role followers")
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

  return users.map((user) => ({
    ...sanitizeUser(user),
    followersCount: user.followers?.length || 0
  }));
}

async function getFollowing(userId) {
  const currentUser = await User.findById(userId)
    .populate("following", "username fullName avatar bio role followers")
    .lean();

  if (!currentUser) {
    throw new AppError(404, "User not found");
  }

  return (currentUser.following || []).map((user) => ({
    ...sanitizeUser(user),
    followersCount: user.followers?.length || 0,
    isFollowing: true
  }));
}

async function blockUser(userId, targetUserId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, "User not found");

  const alreadyBlocked = user.blockedUsers.includes(targetUserId);

  if (alreadyBlocked) {
    user.blockedUsers = user.blockedUsers.filter(id => String(id) !== String(targetUserId));
  } else {
    user.blockedUsers.push(targetUserId);
  }

  await user.save();
  return { blocked: !alreadyBlocked };
}

async function reportUser(reporterId, reportedUserId, reason) {
  const Report = require("./report.model");
  
  const report = await Report.create({
    reporter: reporterId,
    reportedUser: reportedUserId,
    reason
  });

  return report;
}

async function getUserFollowers(viewerId, targetId) {
  const targetUser = await User.findById(targetId)
    .populate("followers", "username fullName avatar bio role followers")
    .lean();

  if (!targetUser) throw new AppError(404, "User not found");

  return (targetUser.followers || []).map((u) => ({
    ...sanitizeUser(u),
    followersCount: u.followers?.length || 0,
    isFollowing: viewerId ? u.followers?.some((fid) => String(fid) === String(viewerId)) : false
  }));
}

async function getUserFollowing(viewerId, targetId) {
  const targetUser = await User.findById(targetId)
    .populate("following", "username fullName avatar bio role followers")
    .lean();

  if (!targetUser) throw new AppError(404, "User not found");

  return (targetUser.following || []).map((u) => ({
    ...sanitizeUser(u),
    followersCount: u.followers?.length || 0,
    isFollowing: viewerId ? u.followers?.some((fid) => String(fid) === String(viewerId)) : false
  }));
}

module.exports = {
  getProfile,
  getProfilePosts,
  getSuggestions,
  searchUsers,
  updateProfile,
  getFollowing,
  blockUser,
  reportUser,
  getUserFollowers,
  getUserFollowing
};
