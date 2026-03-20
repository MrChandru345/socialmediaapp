const { asyncHandler } = require("../../middleware/error.middleware");
const { toggleFollow } = require("./follow.service");

const toggleFollowStatus = asyncHandler(async (req, res) => {
  const result = await toggleFollow(req.user._id, req.params.targetUserId);

  res.json({
    success: true,
    data: result
  });
});

module.exports = {
  toggleFollowStatus
};
