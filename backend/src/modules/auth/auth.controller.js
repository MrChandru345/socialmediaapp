const { asyncHandler } = require("../../middleware/error.middleware");
const {
  getAvailability,
  getCurrentUser,
  loginUser,
  logoutAllSessions,
  logoutSession,
  refreshSession,
  registerUser,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  verifyEmail
} = require("./auth.service");
const {
  validateAvailabilityQuery,
  validateForgotPasswordPayload,
  validateLoginPayload,
  validateRegisterPayload,
  validateResetPasswordPayload
} = require("./auth.validation");

const register = asyncHandler(async (req, res) => {
  const payload = validateRegisterPayload(req.body);
  const response = await registerUser(payload, req, req.file);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: response
  });
});

const login = asyncHandler(async (req, res) => {
  const payload = validateLoginPayload(req.body);
  const response = await loginUser(payload, req);

  res.json({
    success: true,
    message: "Login successful",
    data: response
  });
});

const refresh = asyncHandler(async (req, res) => {
  const response = await refreshSession(req.body?.refreshToken, req);

  res.json({
    success: true,
    message: "Session refreshed",
    data: response
  });
});

const logout = asyncHandler(async (req, res) => {
  const response = await logoutSession(req.body?.refreshToken);

  res.json({
    success: true,
    message: "Logged out",
    data: response
  });
});

const logoutAll = asyncHandler(async (req, res) => {
  const response = await logoutAllSessions(req.user._id);

  res.json({
    success: true,
    message: "All sessions logged out",
    data: response
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.user._id);

  res.json({
    success: true,
    data: user
  });
});

const availability = asyncHandler(async (req, res) => {
  const query = validateAvailabilityQuery(req.query);
  const response = await getAvailability(query);

  res.json({
    success: true,
    data: response
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const payload = validateForgotPasswordPayload(req.body);
  const response = await requestPasswordReset(payload.email);

  res.json({
    success: true,
    data: response
  });
});

const resetPasswordHandler = asyncHandler(async (req, res) => {
  validateResetPasswordPayload(req.body);
  const response = await resetPassword(req.body);

  res.json({
    success: true,
    data: response
  });
});

const resendEmailVerification = asyncHandler(async (req, res) => {
  const response = await resendVerification(req.user._id);

  res.json({
    success: true,
    data: response
  });
});

const verifyEmailHandler = asyncHandler(async (req, res) => {
  const response = await verifyEmail(req.body);

  res.json({
    success: true,
    data: response
  });
});

module.exports = {
  availability,
  forgotPassword,
  login,
  logout,
  logoutAll,
  me,
  refresh,
  register,
  resendEmailVerification,
  resetPassword: resetPasswordHandler,
  verifyEmail: verifyEmailHandler
};
