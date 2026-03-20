const express = require("express");

const { protect, requireAdmin } = require("../../middleware/auth.middleware");
const { deletePostByAdmin, getStats, getUsers } = require("./admin.controller");

const router = express.Router();

router.use(protect, requireAdmin);
router.get("/stats", getStats);
router.get("/users", getUsers);
router.delete("/posts/:postId", deletePostByAdmin);

module.exports = router;
