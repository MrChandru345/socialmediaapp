const { asyncHandler } = require("../../middleware/error.middleware");
const { toggleFollow, acceptFollowRequest, rejectFollowRequest, removeFollower } = require("./follow.service");

const toggleFollowStatus = asyncHandler(async (req, res) => {
  const result = await toggleFollow(req.user._id, req.params.targetUserId);

  res.json({
    success: true,
    data: result
  });
});

const acceptFollowRequestStatus = asyncHandler(async (req, res) => {
  const result = await acceptFollowRequest(req.user._id, req.params.requesterId);
  res.json({ success: true, data: result });
});

const rejectFollowRequestStatus = asyncHandler(async (req, res) => {
  const result = await rejectFollowRequest(req.user._id, req.params.requesterId);
  res.json({ success: true, data: result });
});

const removeFollowerStatus = asyncHandler(async (req, res) => {
  const result = await removeFollower(req.user._id, req.params.followerId);
  res.json({ success: true, data: result });
});

module.exports = {
  toggleFollowStatus,
  acceptFollowRequestStatus,
  rejectFollowRequestStatus,
  removeFollowerStatus
};
