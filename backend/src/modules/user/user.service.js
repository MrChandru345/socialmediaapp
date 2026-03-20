const Post = require("../post/post.model");
const User = require("./user.model");
const { isCloudinaryConfigured, uploadBuffer } = require("../../config/cloudinary");
const { AppError, isValidObjectId, sanitizeUser } = require("../../utils/helpers");

function sanitizeProfile(user, viewerId, postCount) {
  const profile = sanitizeUser(user);

  return {
    ...profile,
    followersCount: user.followers?.length || 0,
    followingCount: user.following?.length || 0,
    postCount,
    isFollowing: viewerId
      ? user.followers?.some((entry) => String(entry) === String(viewerId))
      : false
  };
}

async function getProfile(identifier, viewerId) {
  const query = isValidObjectId(identifier)
    ? { _id: identifier }
    : { username: identifier.trim().toLowerCase() };

  const user = await User.findOne(query).select("-password").lean();

  if (!user) {
    throw new AppError(404, "User profile not found");
  }

  const postCount = await Post.countDocuments({ author: user._id });
  return sanitizeProfile(user, viewerId, postCount);
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

async function searchUsers(query) {
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
    followingCount: user.following?.length || 0
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

module.exports = {
  getProfile,
  getSuggestions,
  searchUsers,
  updateProfile
};
