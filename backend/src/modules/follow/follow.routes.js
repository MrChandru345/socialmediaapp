const express = require("express");

const { protect } = require("../../middleware/auth.middleware");
const { toggleFollowStatus } = require("./follow.controller");

const router = express.Router();

router.post("/:targetUserId", protect, toggleFollowStatus);

module.exports = router;
