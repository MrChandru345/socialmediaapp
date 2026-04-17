const express = require("express");

const { optionalAuth, protect } = require("../../middleware/auth.middleware");
const { upload } = require("../../middleware/upload.middleware");
const {
  getUserProfile,
  getUserProfilePosts,
  listSuggestions,
  searchForUsers,
  updateMyProfile,
  getMyFollowing,
  toggleBlockUser,
  reportAnAccount,
  listUserFollowers,
  listUserFollowing
} = require("./user.controller");

const router = express.Router();

router.get("/search", protect, searchForUsers);
router.get("/suggestions", protect, listSuggestions);
router.get("/me/following", protect, getMyFollowing);
router.patch("/me", protect, upload.single("avatar"), updateMyProfile);
router.post("/:id/block", protect, toggleBlockUser);
router.post("/report", protect, reportAnAccount);
router.get("/:identifier/posts", optionalAuth, getUserProfilePosts);
router.get("/:id/followers", optionalAuth, listUserFollowers);
router.get("/:id/following", optionalAuth, listUserFollowing);
router.get("/:identifier", optionalAuth, getUserProfile);

module.exports = router;
