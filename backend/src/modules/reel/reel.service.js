const { isCloudinaryConfigured, uploadBuffer } = require("../../config/cloudinary");
const {
  AppError,
  buildPaginationMeta,
  normalizeMediaInput,
  parsePagination,
  sanitizeUser
} = require("../../utils/helpers");
const { createNotification } = require("../notification/notification.service");
const Reel = require("./reel.model");

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

function formatReel(reel, viewerId) {
  return {
    ...reel,
    id: String(reel._id),
    author: formatAuthor(reel.author),
    likesCount: reel.likes?.length || 0,
    likedByViewer: viewerId
      ? reel.likes?.some((entry) => String(entry) === String(viewerId))
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

  return {
    url: result.secure_url,
    publicId: result.public_id,
    type: "video"
  };
}

async function createReel(userId, payload, file) {
  const uploadedVideo = await uploadReelVideo(file);
  const payloadVideo = normalizeMediaInput(payload.video || payload.media, "video")[0] || null;
  const video = uploadedVideo || payloadVideo;

  if (!video) {
    throw new AppError(400, "A reel requires a video source");
  }

  const reel = await Reel.create({
    author: userId,
    caption: payload.caption?.trim() || "",
    video
  });

  const populatedReel = await Reel.findById(reel._id)
    .populate("author", "username fullName avatar role")
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
      .populate("author", "username fullName avatar role")
      .lean(),
    Reel.countDocuments(filter)
  ]);

  return {
    items: reels.map((reel) => formatReel(reel, viewerId)),
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
  toggleReelLike
};
