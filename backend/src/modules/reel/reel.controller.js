const { asyncHandler } = require("../../middleware/error.middleware");
const { createReel, deleteReel, getReels, toggleReelLike, toggleReelSave } = require("./reel.service");

const createNewReel = asyncHandler(async (req, res) => {
  const reel = await createReel(req.user._id, req.body, req.file);

  res.status(201).json({
    success: true,
    message: "Reel created successfully",
    data: reel
  });
});

const getAllReels = asyncHandler(async (req, res) => {
  const reels = await getReels(req.query, req.user?._id);

  res.json({
    success: true,
    data: reels
  });
});

const likeReel = asyncHandler(async (req, res) => {
  const result = await toggleReelLike(req.params.reelId, req.user._id);

  res.json({
    success: true,
    data: result
  });
});

const removeReel = asyncHandler(async (req, res) => {
  const result = await deleteReel(req.params.reelId, req.user);

  res.json({
    success: true,
    message: "Reel deleted successfully",
    data: result
  });
});

const saveReel = asyncHandler(async (req, res) => {
  const result = await toggleReelSave(req.params.reelId, req.user._id);

  res.json({
    success: true,
    data: result
  });
});

module.exports = {
  createNewReel,
  getAllReels,
  likeReel,
  saveReel,
  removeReel
};
