const express = require("express");

const { optionalAuth, protect } = require("../../middleware/auth.middleware");
const { upload } = require("../../middleware/upload.middleware");
const {
  createNewPost,
  getExplore,
  getFeedPosts,
  getPost,
  likePost,
  removePost,
  savePost
} = require("./post.controller");

const router = express.Router();

router.get("/feed", protect, getFeedPosts);
router.get("/explore", optionalAuth, getExplore);
router.post("/", protect, upload.array("media", 6), createNewPost);
router.get("/:postId", optionalAuth, getPost);
router.post("/:postId/like", protect, likePost);
router.post("/:postId/save", protect, savePost);
router.delete("/:postId", protect, removePost);

module.exports = router;
