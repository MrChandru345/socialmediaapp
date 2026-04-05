const { asyncHandler } = require("../../middleware/error.middleware");
const {
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
} = require("./user.service");

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await getProfile(req.params.identifier, req.user?._id);
  res.json({ success: true, data: user });
});

const getUserProfilePosts = asyncHandler(async (req, res) => {
  const posts = await getProfilePosts(req.params.identifier, req.user?._id, req.query);
  res.json({ success: true, data: posts });
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const user = await updateProfile(req.user._id, req.body, req.file);
  res.json({ success: true, message: "Profile updated successfully", data: user });
});

const searchForUsers = asyncHandler(async (req, res) => {
  const users = await searchUsers(req.query.q, req.user?._id);
  res.json({ success: true, data: users });
});

const listSuggestions = asyncHandler(async (req, res) => {
  const users = await getSuggestions(req.user._id);
  res.json({ success: true, data: users });
});

const getMyFollowing = asyncHandler(async (req, res) => {
  const users = await getFollowing(req.user._id);
  res.json({ success: true, data: users });
});

const toggleBlockUser = asyncHandler(async (req, res) => {
  const result = await blockUser(req.user._id, req.params.id);
  res.json({ success: true, data: result });
});

const reportAnAccount = asyncHandler(async (req, res) => {
  const report = await reportUser(req.user._id, req.body.reportedUserId, req.body.reason);
  res.json({ success: true, data: report });
});

const listUserFollowers = asyncHandler(async (req, res) => {
  const users = await getUserFollowers(req.user?._id, req.params.id);
  res.json({ success: true, data: users });
});

const listUserFollowing = asyncHandler(async (req, res) => {
  const users = await getUserFollowing(req.user?._id, req.params.id);
  res.json({ success: true, data: users });
});

module.exports = {
  getUserProfile,
  getUserProfilePosts,
  listSuggestions,
  searchForUsers,
  updateMyProfile,
  getMyFollowing,
  toggleBlockUser,
  reportAnAccount,
  listUserFollowers,
  listUserFollowing
};
