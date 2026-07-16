const crypto = require("crypto");
const mongoose = require("mongoose");

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const authSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userAgent: {
      type: String,
      default: ""
    },
    ipAddress: {
      type: String,
      default: ""
    },
    expiresAt: {
      type: Date,
      required: true
    },
    revokedAt: {
      type: Date,
      default: null
    },
    lastUsedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = {
  AuthSession: mongoose.models.AuthSession || mongoose.model("AuthSession", authSessionSchema),
  hashToken
};
