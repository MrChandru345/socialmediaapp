const express = require("express");

const { optionalAuth, protect } = require("../../middleware/auth.middleware");
const { upload } = require("../../middleware/upload.middleware");
const { createNewReel, getAllReels, getSingleReel, likeReel, saveReel, removeReel } = require("./reel.controller");

const router = express.Router();

router.get("/", optionalAuth, getAllReels);
router.get("/:reelId", optionalAuth, getSingleReel);
router.post("/", protect, upload.single("video"), createNewReel);
router.post("/:reelId/like", protect, likeReel);
router.post("/:reelId/save", protect, saveReel);
router.delete("/:reelId", protect, removeReel);

module.exports = router;
