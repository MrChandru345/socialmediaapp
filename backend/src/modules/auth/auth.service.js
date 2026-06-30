const crypto = require("crypto");

const { isCloudinaryConfigured, uploadBuffer } = require("../../config/cloudinary");
const env = require("../../config/env");
const User = require("../user/user.model");
const { AuthSession, hashToken } = require("./auth-session.model");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../../utils/token");
const { AppError, sanitizeUser } = require("../../utils/helpers");
const { normalizeEmail, normalizeUsername } = require("./auth.validation");

function parseExpiryDuration(value) {
  const match = String(value || "").trim().match(/^(\d+)([smhd])$/i);

  if (!match) {
    return 30 * 24 * 60 * 60 * 1000;
  }

  const amount = Number.parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  return amount * multipliers[unit];
}

function getSessionMeta(request = {}) {
  return {
    userAgent: request.headers?.["user-agent"] || "",
    ipAddress: request.ip || request.connection?.remoteAddress || ""
  };
}

function buildAccessToken(user) {
  return generateAccessToken({
    sub: String(user._id),
    role: user.role
  });
}

async function createSession(user, request) {
  const sessionId = crypto.randomUUID();
  const refreshToken = generateRefreshToken({
    sub: String(user._id),
    sid: sessionId,
    type: "refresh"
  });
  const expiresAt = new Date(Date.now() + parseExpiryDuration(env.refreshTokenExpiresIn));
  const meta = getSessionMeta(request);

  await AuthSession.create({
    sessionId,
    user: user._id,
    tokenHash: hashToken(refreshToken),
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress,
    expiresAt
  });

  return refreshToken;
}

async function rotateRefreshToken(existingSession, user, request) {
  const refreshToken = generateRefreshToken({
    sub: String(user._id),
    sid: String(existingSession._id),
    type: "refresh"
  });
  const meta = getSessionMeta(request);

  existingSession.tokenHash = hashToken(refreshToken);
  existingSession.lastUsedAt = new Date();
  existingSession.userAgent = meta.userAgent;
  existingSession.ipAddress = meta.ipAddress;
  await existingSession.save();

  return refreshToken;
}

async function buildAuthResponse(user, request, existingSession = null) {
  const accessToken = buildAccessToken(user);
  const refreshToken = existingSession
    ? await rotateRefreshToken(existingSession, user, request)
    : await createSession(user, request);

  return {
    token: accessToken,
    accessToken,
    refreshToken,
    user: sanitizeUser(user)
  };
}

async function uploadSignupAvatar(file) {
  if (!file) {
    return null;
  }

  if (!isCloudinaryConfigured) {
    throw new AppError(400, "Cloudinary must be configured before uploading profile pictures");
  }

  const result = await uploadBuffer(file.buffer, {
    folder: "socialmediaapp/avatars",
    resource_type: "image"
  });

  return {
    url: result.secure_url,
    publicId: result.public_id
  };
}

async function assertUniqueIdentity(email, username) {
  const existing = await User.findOne({
    $or: [{ email }, { username }]
  }).lean();

  if (!existing) {
    return;
  }

  if (existing.email === email) {
    throw new AppError(409, "Email is already in use", ["Email taken"]);
  }

  throw new AppError(409, "Username is already in use", ["Username taken"]);
}

async function registerUser(payload, request, file) {
  const normalizedEmail = normalizeEmail(payload.email);
  const normalizedUsername = normalizeUsername(payload.username);

  await assertUniqueIdentity(normalizedEmail, normalizedUsername);

  const uploadedAvatar = await uploadSignupAvatar(file);
  const avatarUrl = String(payload.avatarUrl || "").trim();

  const user = await User.create({
    username: normalizedUsername,
    email: normalizedEmail,
    password: payload.password,
    fullName: payload.fullName?.trim() || payload.username.trim(),
    birthDate: payload.birthDate || null,
    gender: payload.gender || "",
    avatar: uploadedAvatar || (avatarUrl ? { url: avatarUrl, publicId: "" } : undefined),
    bio: payload.bio?.trim() || ""
  });

  return buildAuthResponse(user, request);
}

async function loginUser(payload, request) {
  const identifier = String(payload.identifier || "").trim().toLowerCase();
  const query = identifier.includes("@")
    ? { email: identifier }
    : { username: identifier };
  const user = await User.findOne(query).select("+password");

  if (!user) {
    throw new AppError(401, identifier.includes("@") ? "Email doesn't exist" : "Username doesn't exist");
  }

  if (user.status === "suspended") {
    throw new AppError(403, "Account suspended");
  }

  const isPasswordValid = await user.comparePassword(payload.password);

  if (!isPasswordValid) {
    throw new AppError(401, "Incorrect password");
  }

  user.lastSeen = new Date();
  await user.save();

  return buildAuthResponse(user, request);
}

async function refreshSession(refreshToken, request) {
  if (!refreshToken) {
    throw new AppError(401, "Refresh token is required");
  }

  let decodedToken;

  try {
    decodedToken = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  const session = await AuthSession.findOne({
    sessionId: decodedToken.sid,
    user: decodedToken.sub,
    tokenHash: hashToken(refreshToken),
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  });

  if (!session) {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decodedToken.sub);

  if (!user) {
    throw new AppError(401, "The authenticated user no longer exists");
  }

  if (user.status === "suspended") {
    throw new AppError(403, "Account suspended");
  }

  return buildAuthResponse(user, request, session);
}

async function logoutSession(refreshToken) {
  if (!refreshToken) {
    return { revoked: false };
  }

  await AuthSession.updateOne(
    { tokenHash: hashToken(refreshToken), revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );

  return { revoked: true };
}

async function logoutAllSessions(userId) {
  await AuthSession.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );

  return { revoked: true };
}

async function getAvailability({ email, username }) {
  const checks = {};

  if (email) {
    const existingEmail = await User.exists({ email: normalizeEmail(email) });
    checks.email = {
      value: normalizeEmail(email),
      available: !existingEmail
    };
  }

  if (username) {
    const existingUsername = await User.exists({ username: normalizeUsername(username) });
    checks.username = {
      value: normalizeUsername(username),
      available: !existingUsername
    };
  }

  return checks;
}

async function getCurrentUser(userId) {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return sanitizeUser(user);
}

async function requestPasswordReset(email) {
  await User.exists({ email: normalizeEmail(email) });

  return {
    delivery: "email",
    otpReady: true,
    message: "If an account exists for this email, a reset link will be sent."
  };
}

async function resetPassword() {
  return {
    resetReady: true,
    message: "Password reset is ready for a mail or OTP provider."
  };
}

async function resendVerification(userId) {
  await User.findById(userId).select("_id");

  return {
    verificationReady: true,
    message: "Verification email is ready for a mail provider."
  };
}

async function verifyEmail() {
  return {
    verified: false,
    verificationReady: true,
    message: "Email verification is ready for a mail provider."
  };
}

module.exports = {
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
};
