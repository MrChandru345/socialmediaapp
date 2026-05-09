const { isCloudinaryConfigured, uploadBuffer } = require("../../config/cloudinary");
const { AppError, buildPaginationMeta, normalizeMediaInput, parsePagination, sanitizeUser } = require("../../utils/helpers");
const { createNotification } = require("../notification/notification.service");
const User = require("../user/user.model");
const Post = require("./post.model");

async function uploadMediaFiles(files, folder) {
  if (!files?.length) {
    return [];
  }

  if (!isCloudinaryConfigured) {
    throw new AppError(400, "Cloudinary must be configured before uploading files");
  }

  return Promise.all(
    files.map(async (file) => {
      const resourceType = file.mimetype.startsWith("video/") ? "video" : "image";
      const result = await uploadBuffer(file.buffer, {
        folder,
        resource_type: resourceType
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        type: resourceType
      };
    })
  );
}

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
    location: user.location,
    role: user.role
  };
}

function formatPost(post, viewerId) {
  return {
    ...post,
    id: String(post._id),
    author: formatAuthor(post.author),
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

async function createPost(userId, payload, files) {
  const uploadedMedia = await uploadMediaFiles(files, "socialmediaapp/posts");
  const payloadMedia = normalizeMediaInput(payload.media);
  const media = [...payloadMedia, ...uploadedMedia];

  if (media.length === 0) {
    throw new AppError(400, "A post requires at least one media item");
  }

  const post = await Post.create({
    author: userId,
    caption: payload.caption?.trim() || "",
    visibility: payload.visibility || "public",
    media
  });

  const populatedPost = await Post.findById(post._id)
    .populate("author", "username fullName avatar location role")
    .lean();

  return formatPost(populatedPost, userId);
}

async function getFeed(userId, query) {
  const { page, limit, skip } = parsePagination(query);
  const currentUser = await User.findById(userId).select("following").lean();

  if (!currentUser) {
    throw new AppError(404, "User not found");
  }

  const authorIds = [userId, ...(currentUser.following || [])];
  const filter = {
    $or: [
      { visibility: "public" },
      { author: { $in: authorIds } }
    ]
  };

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
    items: posts.map((post) => formatPost(post, userId)),
    meta: buildPaginationMeta(page, limit, total)
  };
}

async function getExplorePosts(query, viewerId) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { visibility: "public" };

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
    items: posts.map((post) => formatPost(post, viewerId)),
    meta: buildPaginationMeta(page, limit, total)
  };
}

async function getPostById(postId, viewerId) {
  const post = await Post.findById(postId)
    .populate("author", "username fullName avatar location role")
    .lean();

  if (!post) {
    throw new AppError(404, "Post not found");
  }

  return formatPost(post, viewerId);
}

async function toggleLike(postId, userId) {
  const post = await Post.findById(postId);

  if (!post) {
    throw new AppError(404, "Post not found");
  }

  const isLiked = post.likes.some((entry) => String(entry) === String(userId));

  if (isLiked) {
    post.likes.pull(userId);
  } else {
    post.likes.addToSet(userId);
  }

  await post.save();

  if (!isLiked && String(post.author) !== String(userId)) {
    await createNotification({
      recipient: post.author,
      actor: userId,
      type: "like",
      entityId: post._id,
      entityModel: "Post",
      message: "liked your post"
    });
  }

  return {
    liked: !isLiked,
    likesCount: post.likes.length
  };
}

async function toggleSave(postId, userId) {
  const [post, user] = await Promise.all([
    Post.findById(postId),
    User.findById(userId).select("savedPosts")
  ]);

  if (!post) {
    throw new AppError(404, "Post not found");
  }

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const isSaved = post.saves.some((entry) => String(entry) === String(userId));

  if (isSaved) {
    post.saves.pull(userId);
    user.savedPosts.pull(postId);
  } else {
    post.saves.addToSet(userId);
    user.savedPosts.addToSet(postId);
  }

  await Promise.all([post.save(), user.save()]);

  return {
    saved: !isSaved,
    savesCount: post.saves.length
  };
}

async function deletePost(postId, requester) {
  const post = await Post.findById(postId);

  if (!post) {
    throw new AppError(404, "Post not found");
  }

  const isOwner = String(post.author) === String(requester._id);
  const isAdmin = requester.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new AppError(403, "You do not have permission to delete this post");
  }

  await Post.deleteOne({ _id: postId });

  return {
    deleted: true,
    postId
  };
}

module.exports = {
  createPost,
  deletePost,
  getExplorePosts,
  getFeed,
  getPostById,
  toggleLike,
  toggleSave
};



