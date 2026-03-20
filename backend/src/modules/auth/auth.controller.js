const { asyncHandler } = require("../../middleware/error.middleware");
const { getCurrentUser, loginUser, registerUser } = require("./auth.service");
const { validateLoginPayload, validateRegisterPayload } = require("./auth.validation");

const register = asyncHandler(async (req, res) => {
  validateRegisterPayload(req.body);

  const response = await registerUser(req.body);
  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: response
  });
});

const login = asyncHandler(async (req, res) => {
  validateLoginPayload(req.body);

  const response = await loginUser(req.body);
  res.json({
    success: true,
    message: "Login successful",
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

module.exports = {
  login,
  me,
  register
};
