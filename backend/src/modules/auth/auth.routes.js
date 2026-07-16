const express = require("express");

const { protect } = require("../../middleware/auth.middleware");
const { upload } = require("../../middleware/upload.middleware");
const {
  availability,
  forgotPassword,
  login,
  logout,
  logoutAll,
  me,
  refresh,
  register,
  resendEmailVerification,
  resetPassword,
  verifyEmail
} = require("./auth.controller");

const router = express.Router();

router.get("/availability", availability);
router.post("/register", upload.single("avatar"), register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/logout-all", protect, logoutAll);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", protect, resendEmailVerification);
router.get("/me", protect, me);

module.exports = router;
