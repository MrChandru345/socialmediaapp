const mongoose = require("mongoose");

class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

function parsePagination(query = {}) {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 50);
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip
  };
}

function buildPaginationMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1)
  };
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const userObject = typeof user.toObject === "function" ? user.toObject() : { ...user };

  delete userObject.password;
  delete userObject.__v;

  return {
    ...userObject,
    id: String(userObject._id)
  };
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function buildRoomId(firstUserId, secondUserId) {
  return [String(firstUserId), String(secondUserId)].sort().join(":");
}

function parseJsonIfString(value) {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
}

function normalizeMediaInput(value, defaultType = "image") {
  const parsedValue = parseJsonIfString(value);
  const mediaArray = Array.isArray(parsedValue)
    ? parsedValue
    : parsedValue
      ? [parsedValue]
      : [];

  return mediaArray
    .map((item) => {
      if (typeof item === "string") {
        return { url: item, type: defaultType };
      }

      if (!item || !item.url) {
        return null;
      }

      return {
        url: item.url,
        publicId: item.publicId || "",
        type: item.type || defaultType
      };
    })
    .filter(Boolean);
}

module.exports = {
  AppError,
  buildPaginationMeta,
  buildRoomId,
  isValidObjectId,
  normalizeMediaInput,
  parseJsonIfString,
  parsePagination,
  sanitizeUser
};
