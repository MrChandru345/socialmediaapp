const { asyncHandler } = require("../../middleware/error.middleware");
const {
  getProfile,
  getProfilePosts,
  getSuggestions,
  searchUsers,
  updateProfile,
  getFollowing
} = require("./user.service");

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await getProfile(req.params.identifier, req.user?._id);

  res.json({
    success: true,
    data: user
  });
});

const getUserProfilePosts = asyncHandler(async (req, res) => {
  const posts = await getProfilePosts(req.params.identifier, req.user?._id, req.query);

  res.json({
    success: true,
    data: posts
  });
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const user = await updateProfile(req.user._id, req.body, req.file);

  res.json({
    success: true,
    message: "Profile updated successfully",
    data: user
  });
});

const searchForUsers = asyncHandler(async (req, res) => {
  const users = await searchUsers(req.query.q, req.user?._id);

  res.json({
    success: true,
    data: users
  });
});

const listSuggestions = asyncHandler(async (req, res) => {
  const users = await getSuggestions(req.user._id);

  res.json({
    success: true,
    data: users
  });
});

const getMyFollowing = asyncHandler(async (req, res) => {
  const users = await getFollowing(req.user._id);

  res.json({
    success: true,
    data: users
  });
});

module.exports = {
  getUserProfile,
  getUserProfilePosts,
  listSuggestions,
  searchForUsers,
  updateMyProfile,
  getMyFollowing
};
