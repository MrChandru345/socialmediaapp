const express = require("express");

const { protect } = require("../../middleware/auth.middleware");
const {
  toggleFollowStatus,
  acceptFollowRequestStatus,
  rejectFollowRequestStatus,
  removeFollowerStatus
} = require("./follow.controller");

const router = express.Router();

router.post("/:targetUserId", protect, toggleFollowStatus);
router.post("/accept/:requesterId", protect, acceptFollowRequestStatus);
router.post("/reject/:requesterId", protect, rejectFollowRequestStatus);
router.delete("/remove/:followerId", protect, removeFollowerStatus);

module.exports = router;
