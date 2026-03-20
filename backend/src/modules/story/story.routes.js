const express = require("express");

const { protect } = require("../../middleware/auth.middleware");
const { upload } = require("../../middleware/upload.middleware");
const { createNewStory, getFeed, removeStory } = require("./story.controller");

const router = express.Router();

router.use(protect);
router.get("/feed", getFeed);
router.post("/", upload.single("media"), createNewStory);
router.delete("/:storyId", removeStory);

module.exports = router;
