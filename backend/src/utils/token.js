const jwt = require("jsonwebtoken");

const env = require("../config/env");

function generateToken(payload, options = {}) {
  return jwt.sign(payload, options.secret || env.jwtSecret, {
    expiresIn: options.expiresIn || env.jwtExpiresIn
  });
}

function generateAccessToken(payload) {
  return generateToken(payload, {
    secret: env.jwtSecret,
    expiresIn: env.jwtExpiresIn
  });
}

function generateRefreshToken(payload) {
  return generateToken(payload, {
    secret: env.refreshTokenSecret,
    expiresIn: env.refreshTokenExpiresIn
  });
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.refreshTokenSecret);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateToken,
  verifyRefreshToken,
  verifyToken
};
