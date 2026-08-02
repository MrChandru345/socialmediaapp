const express = require("express");

const { optionalAuth, protect } = require("../../middleware/auth.middleware");
const { upload } = require("../../middleware/upload.middleware");
const {
  deleteMyAccount,
  getUserProfile,
  getUserProfilePosts,
  listSuggestions,
  searchForUsers,
  updateMyProfile,
  getMyFollowing,
  toggleBlockUser,
  reportAnAccount,
  listUserFollowers,
  listUserFollowing,
  listMySavedPosts
} = require("./user.controller");

const router = express.Router();

router.delete("/me", protect, deleteMyAccount);
router.get("/search", protect, searchForUsers);
router.get("/suggestions", protect, listSuggestions);
router.get("/me/following", protect, getMyFollowing);
router.get("/me/saved", protect, listMySavedPosts);
router.patch("/me", protect, upload.single("avatar"), updateMyProfile);
router.post("/:id/block", protect, toggleBlockUser);
router.post("/report", protect, reportAnAccount);
router.get("/:identifier/posts", optionalAuth, getUserProfilePosts);
router.get("/:id/followers", optionalAuth, listUserFollowers);
router.get("/:id/following", optionalAuth, listUserFollowing);
router.get("/:identifier", optionalAuth, getUserProfile);

module.exports = router;
