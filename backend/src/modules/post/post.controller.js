const { asyncHandler } = require("../../middleware/error.middleware");
const {
  createPost,
  deletePost,
  getExplorePosts,
  getFeed,
  getPostById,
  toggleLike,
  toggleSave
} = require("./post.service");

const createNewPost = asyncHandler(async (req, res) => {
  const post = await createPost(req.user._id, req.body, req.files);

  res.status(201).json({
    success: true,
    message: "Post created successfully",
    data: post
  });
});

const getFeedPosts = asyncHandler(async (req, res) => {
  const feed = await getFeed(req.user._id, req.query);

  res.json({
    success: true,
    data: feed
  });
});

const getExplore = asyncHandler(async (req, res) => {
  const posts = await getExplorePosts(req.query, req.user?._id);

  res.json({
    success: true,
    data: posts
  });
});

const getPost = asyncHandler(async (req, res) => {
  const post = await getPostById(req.params.postId, req.user?._id);

  res.json({
    success: true,
    data: post
  });
});

const likePost = asyncHandler(async (req, res) => {
  const result = await toggleLike(req.params.postId, req.user._id);

  res.json({
    success: true,
    data: result
  });
});

const savePost = asyncHandler(async (req, res) => {
  const result = await toggleSave(req.params.postId, req.user._id);

  res.json({
    success: true,
    data: result
  });
});

const removePost = asyncHandler(async (req, res) => {
  const result = await deletePost(req.params.postId, req.user);

  res.json({
    success: true,
    message: "Post deleted successfully",
    data: result
  });
});

module.exports = {
  createNewPost,
  getExplore,
  getFeedPosts,
  getPost,
  likePost,
  removePost,
  savePost
};
