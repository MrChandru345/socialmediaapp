const { asyncHandler } = require("../../middleware/error.middleware");
const { getDashboardStats, listUsers, removePost } = require("./admin.service");

const getStats = asyncHandler(async (req, res) => {
  const stats = await getDashboardStats();

  res.json({
    success: true,
    data: stats
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await listUsers(req.query.q);

  res.json({
    success: true,
    data: users
  });
});

const deletePostByAdmin = asyncHandler(async (req, res) => {
  const result = await removePost(req.params.postId);

  res.json({
    success: true,
    message: "Post removed by admin",
    data: result
  });
});

module.exports = {
  deletePostByAdmin,
  getStats,
  getUsers
};
