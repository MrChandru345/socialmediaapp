const User = require("../user/user.model");
const { generateToken } = require("../../utils/token");
const { AppError, sanitizeUser } = require("../../utils/helpers");

function buildAuthResponse(user) {
  return {
    token: generateToken({
      sub: String(user._id),
      role: user.role
    }),
    user: sanitizeUser(user)
  };
}

async function registerUser(payload) {
  const normalizedEmail = payload.email.trim().toLowerCase();
  const normalizedUsername = payload.username.trim().toLowerCase();

  const existingUser = await User.findOne({
    $or: [{ email: normalizedEmail }, { username: normalizedUsername }]
  }).lean();

  if (existingUser) {
    throw new AppError(409, "Email or username is already in use");
  }

  const user = await User.create({
    username: normalizedUsername,
    email: normalizedEmail,
    password: payload.password,
    fullName: payload.fullName?.trim() || payload.username.trim(),
    bio: payload.bio?.trim() || ""
  });

  return buildAuthResponse(user);
}

async function loginUser(payload) {
  const user = await User.findOne({
    email: payload.email.trim().toLowerCase()
  }).select("+password");

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const isPasswordValid = await user.comparePassword(payload.password);

  if (!isPasswordValid) {
    throw new AppError(401, "Invalid email or password");
  }

  user.lastSeen = new Date();
  await user.save();

  return buildAuthResponse(user);
}

async function getCurrentUser(userId) {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return sanitizeUser(user);
}

module.exports = {
  getCurrentUser,
  loginUser,
  registerUser
};
