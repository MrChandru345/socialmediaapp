const { asyncHandler } = require("../../middleware/error.middleware");
const { createStory, deleteStory, getFeedStories } = require("./story.service");

const createNewStory = asyncHandler(async (req, res) => {
  const story = await createStory(req.user._id, req.body, req.file);

  res.status(201).json({
    success: true,
    message: "Story created successfully",
    data: story
  });
});

const getFeed = asyncHandler(async (req, res) => {
  const stories = await getFeedStories(req.user._id);

  res.json({
    success: true,
    data: stories
  });
});

const removeStory = asyncHandler(async (req, res) => {
  const result = await deleteStory(req.params.storyId, req.user);

  res.json({
    success: true,
    message: "Story deleted successfully",
    data: result
  });
});

module.exports = {
  createNewStory,
  getFeed,
  removeStory
};
