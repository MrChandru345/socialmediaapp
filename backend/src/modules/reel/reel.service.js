const { cloudinary, isCloudinaryConfigured, uploadBuffer } = require("../../config/cloudinary");
const {
  AppError,
  buildPaginationMeta,
  normalizeMediaInput,
  parsePagination,
  sanitizeUser
} = require("../../utils/helpers");
const logger = require("../../utils/logger");
const { createNotification } = require("../notification/notification.service");
const { REEL_CAPTION_MAX_LENGTH } = require("./reel.constants");
const Reel = require("./reel.model");

function formatAuthor(author, viewerId) {
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
    role: user.role,
    followersCount: user.followers?.length || 0,
    isFollowing: viewerId
      ? user.followers?.some((entry) => String(entry) === String(viewerId))
      : false
  };
}

function formatReel(reel, viewerId) {
  if (!reel || !reel._id) {
    return null;
  }

  return {
    ...reel,
    id: String(reel._id),
    author: formatAuthor(reel.author, viewerId),
    likesCount: reel.likes?.length || 0,
    likedByViewer: viewerId
      ? reel.likes?.some((entry) => String(entry) === String(viewerId))
      : false,
    savesCount: reel.saves?.length || 0,
    savedByViewer: viewerId
      ? reel.saves?.some((entry) => String(entry) === String(viewerId))
      : false
  };
}

async function uploadReelVideo(file) {
  if (!file) {
    return null;
  }

  if (!isCloudinaryConfigured) {
    throw new AppError(400, "Cloudinary must be configured before uploading files");
  }

  if (!file.mimetype.startsWith("video/")) {
    throw new AppError(400, "Reels require a video file");
  }

  const result = await uploadBuffer(file.buffer, {
    folder: "socialmediaapp/reels",
    resource_type: "video"
  });

  const url = result.secure_url || result.url;

  if (!url) {
    throw new AppError(502, "Cloudinary did not return a video URL");
  }

  return {
    url,
    publicId: result.public_id,
    type: "video"
  };
}

async function deleteUploadedReelVideo(video) {
  if (!video?.publicId || !isCloudinaryConfigured) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(video.publicId, { resource_type: "video" });
  } catch (error) {
    logger.warn("Failed to clean up reel video after create failure", {
      publicId: video.publicId,
      error: error.message
    });
  }
}

function normalizeCaption(caption) {
  const normalizedCaption = caption?.trim() || "";

  if (normalizedCaption.length > REEL_CAPTION_MAX_LENGTH) {
    throw new AppError(
      400,
      `Caption must be ${REEL_CAPTION_MAX_LENGTH} characters or fewer`
    );
  }

  return normalizedCaption;
}

async function createReel(userId, payload = {}, file) {
  const caption = normalizeCaption(payload.caption);
  const uploadedVideo = await uploadReelVideo(file);
  const payloadVideo = normalizeMediaInput(payload.video || payload.media, "video")[0] || null;
  const video = uploadedVideo || payloadVideo;

  if (!video) {
    throw new AppError(400, "A reel requires a video source");
  }

  let reel;

  try {
    reel = await Reel.create({
      author: userId,
      caption,
      video
    });
  } catch (error) {
    await deleteUploadedReelVideo(uploadedVideo);
    throw error;
  }

  const populatedReel = await Reel.findById(reel._id)
    .populate("author", "username fullName avatar role followers")
    .lean();

  return formatReel(populatedReel, userId);
}

async function getReels(query, viewerId) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  
  if (query.author) {
    filter.author = query.author;
  }

  const [reels, total] = await Promise.all([
    Reel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "username fullName avatar role followers")
      .lean(),
    Reel.countDocuments(filter)
  ]);

  return {
    items: reels.map((reel) => formatReel(reel, viewerId)).filter(Boolean),
    meta: buildPaginationMeta(page, limit, total)
  };
}

async function toggleReelLike(reelId, userId) {
  const reel = await Reel.findById(reelId);

  if (!reel) {
    throw new AppError(404, "Reel not found");
  }

  const isLiked = reel.likes.some((entry) => String(entry) === String(userId));

  if (isLiked) {
    reel.likes.pull(userId);
  } else {
    reel.likes.addToSet(userId);
  }

  await reel.save();

  if (!isLiked && String(reel.author) !== String(userId)) {
    await createNotification({
      recipient: reel.author,
      actor: userId,
      type: "like",
      entityId: reel._id,
      entityModel: "Reel",
      message: "liked your reel"
    });
  }

  return {
    liked: !isLiked,
    likesCount: reel.likes.length
  };
}

async function toggleReelSave(reelId, userId) {
  const User = require("../user/user.model");
  const [reel, user] = await Promise.all([
    Reel.findById(reelId),
    User.findById(userId).select("savedReels")
  ]);

  if (!reel) {
    throw new AppError(404, "Reel not found");
  }

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const isSaved = reel.saves.some((entry) => String(entry) === String(userId));

  if (isSaved) {
    reel.saves.pull(userId);
    user.savedReels.pull(reelId);
  } else {
    reel.saves.addToSet(userId);
    user.savedReels.addToSet(reelId);
  }

  await Promise.all([reel.save(), user.save()]);

  return {
    saved: !isSaved,
    savesCount: reel.saves.length
  };
}

async function deleteReel(reelId, requester) {
  const reel = await Reel.findById(reelId);

  if (!reel) {
    throw new AppError(404, "Reel not found");
  }

  const isOwner = String(reel.author) === String(requester._id);
  const isAdmin = requester.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new AppError(403, "You do not have permission to delete this reel");
  }

  await Reel.deleteOne({ _id: reelId });

  return {
    deleted: true,
    reelId
  };
}

module.exports = {
  createReel,
  deleteReel,
  getReels,
  toggleReelLike,
  toggleReelSave
};
