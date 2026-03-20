const { asyncHandler } = require("../../middleware/error.middleware");
const { getProfile, getSuggestions, searchUsers, updateProfile } = require("./user.service");

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await getProfile(req.params.identifier, req.user?._id);

  res.json({
    success: true,
    data: user
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
  const users = await searchUsers(req.query.q);

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

module.exports = {
  getUserProfile,
  listSuggestions,
  searchForUsers,
  updateMyProfile
};
