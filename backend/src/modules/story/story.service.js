const env = require("../../config/env");
const { isCloudinaryConfigured, uploadBuffer } = require("../../config/cloudinary");
const { AppError, normalizeMediaInput, sanitizeUser } = require("../../utils/helpers");
const User = require("../user/user.model");
const Story = require("./story.model");

function formatAuthor(author) {
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
    role: user.role
  };
}

function formatStory(story) {
  return {
    ...story,
    id: String(story._id),
    author: formatAuthor(story.author),
    viewersCount: story.viewers?.length || 0
  };
}

async function uploadStoryMedia(file) {
  if (!file) {
    return null;
  }

  if (!isCloudinaryConfigured) {
    throw new AppError(400, "Cloudinary must be configured before uploading files");
  }

  const type = file.mimetype.startsWith("video/") ? "video" : "image";
  const result = await uploadBuffer(file.buffer, {
    folder: "socialmediaapp/stories",
    resource_type: type
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    type
  };
}

async function createStory(userId, payload, file) {
  const uploadedMedia = await uploadStoryMedia(file);
  const payloadMedia = normalizeMediaInput(payload.media)[0] || null;
  const media = uploadedMedia || payloadMedia;

  if (!media) {
    throw new AppError(400, "A story requires a media item");
  }

  const expiresAt = new Date(Date.now() + env.storyRetentionHours * 60 * 60 * 1000);
  const story = await Story.create({
    author: userId,
    media,
    caption: payload.caption?.trim() || "",
    expiresAt
  });

  const populatedStory = await Story.findById(story._id)
    .populate("author", "username fullName avatar role")
    .lean();

  return formatStory(populatedStory);
}

async function getFeedStories(userId) {
  const currentUser = await User.findById(userId).select("following").lean();

  if (!currentUser) {
    throw new AppError(404, "User not found");
  }

  const authorIds = [userId, ...(currentUser.following || [])];
  const stories = await Story.find({
    author: { $in: authorIds },
    expiresAt: { $gt: new Date() }
  })
    .sort({ createdAt: -1 })
    .populate("author", "username fullName avatar role")
    .lean();

  const groupedStories = new Map();

  stories.forEach((story) => {
    const authorId = String(story.author._id);

    if (!groupedStories.has(authorId)) {
      groupedStories.set(authorId, {
        author: formatAuthor(story.author),
        items: []
      });
    }

    groupedStories.get(authorId).items.push(formatStory(story));
  });

  return Array.from(groupedStories.values());
}

async function deleteStory(storyId, requester) {
  const story = await Story.findById(storyId);

  if (!story) {
    throw new AppError(404, "Story not found");
  }

  const isOwner = String(story.author) === String(requester._id);
  const isAdmin = requester.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new AppError(403, "You do not have permission to delete this story");
  }

  await Story.deleteOne({ _id: storyId });

  return {
    deleted: true,
    storyId
  };
}

async function deleteExpiredStories() {
  const result = await Story.deleteMany({ expiresAt: { $lte: new Date() } });

  return {
    deletedCount: result.deletedCount
  };
}

module.exports = {
  createStory,
  deleteExpiredStories,
  deleteStory,
  getFeedStories
};
