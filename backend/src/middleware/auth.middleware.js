const User = require("../modules/user/user.model");
const { verifyToken } = require("../utils/token");
const { AppError } = require("../utils/helpers");
const { asyncHandler } = require("./error.middleware");

function extractBearerToken(authorizationHeader = "") {
  if (!authorizationHeader.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice(7).trim();
}

const protect = asyncHandler(async (req, res, next) => {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    throw new AppError(401, "Authentication token is required");
  }

  let decodedToken;

  try {
    decodedToken = verifyToken(token);
  } catch (error) {
    throw new AppError(401, error.name === "TokenExpiredError" ? "Access token expired" : "Invalid access token");
  }

  const user = await User.findById(decodedToken.sub).select("-password");

  if (!user) {
    throw new AppError(401, "The authenticated user no longer exists");
  }

  if (user.status === "suspended") {
    throw new AppError(403, "Account suspended");
  }

  req.user = user;
  next();
});

const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    next();
    return;
  }

  try {
    const decodedToken = verifyToken(token);
    const user = await User.findById(decodedToken.sub).select("-password");
    req.user = user || null;
  } catch (error) {
    req.user = null;
  }

  next();
});

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    next(new AppError(403, "Admin access is required"));
    return;
  }

  next();
}

module.exports = {
  extractBearerToken,
  optionalAuth,
  protect,
  requireAdmin
};
