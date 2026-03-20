const express = require("express");

const { optionalAuth, protect } = require("../../middleware/auth.middleware");
const { upload } = require("../../middleware/upload.middleware");
const { createNewReel, getAllReels, likeReel, removeReel } = require("./reel.controller");

const router = express.Router();

router.get("/", optionalAuth, getAllReels);
router.post("/", protect, upload.single("video"), createNewReel);
router.post("/:reelId/like", protect, likeReel);
router.delete("/:reelId", protect, removeReel);

module.exports = router;
