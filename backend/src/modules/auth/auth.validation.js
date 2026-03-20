const { AppError } = require("../../utils/helpers");

function validateRegisterPayload(payload = {}) {
  const errors = [];

  if (!payload.username || payload.username.trim().length < 3) {
    errors.push("Username must be at least 3 characters long");
  }

  if (!payload.email || !/\S+@\S+\.\S+/.test(payload.email)) {
    errors.push("A valid email address is required");
  }

  if (!payload.password || payload.password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (errors.length > 0) {
    throw new AppError(400, "Validation failed", errors);
  }
}

function validateLoginPayload(payload = {}) {
  const errors = [];

  if (!payload.email || !/\S+@\S+\.\S+/.test(payload.email)) {
    errors.push("A valid email address is required");
  }

  if (!payload.password) {
    errors.push("Password is required");
  }

  if (errors.length > 0) {
    throw new AppError(400, "Validation failed", errors);
  }
}

module.exports = {
  validateLoginPayload,
  validateRegisterPayload
};
