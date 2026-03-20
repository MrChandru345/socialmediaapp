const { AppError } = require("../utils/helpers");

function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function notFoundHandler(req, res, next) {
  next(new AppError(404, `Route ${req.method} ${req.originalUrl} not found`));
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const payload = {
    success: false,
    message: error.message || "Internal server error"
  };

  if (error.details) {
    payload.details = error.details;
  }

  if (error.name === "ValidationError") {
    payload.message = "Validation failed";
    payload.details = Object.values(error.errors).map((entry) => entry.message);
  }

  if (error.name === "CastError") {
    payload.message = "Invalid resource identifier";
  }

  if (process.env.NODE_ENV !== "production" && error.stack) {
    payload.stack = error.stack;
  }

  res.status(statusCode).json(payload);
}

module.exports = {
  asyncHandler,
  errorHandler,
  notFoundHandler
};
