const express = require("express");

const { protect } = require("../../middleware/auth.middleware");
const { createComment, getCommentsForPost, removeComment, toggleLikeComment } = require("./comment.controller");

const router = express.Router();

router.get("/post/:postId", getCommentsForPost);
router.post("/post/:postId", protect, createComment);
router.delete("/:commentId", protect, removeComment);
router.post("/:commentId/like", protect, toggleLikeComment);

module.exports = router;
