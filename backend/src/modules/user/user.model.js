const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },
    fullName: {
      type: String,
      trim: true,
      maxlength: 60,
      default: ""
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 200,
      default: ""
    },
    avatar: {
      url: {
        type: String,
        default: ""
      },
      publicId: {
        type: String,
        default: ""
      }
    },
    website: {
      type: String,
      trim: true,
      default: ""
    },
    location: {
      type: String,
      trim: true,
      default: ""
    },
    birthDate: {
      type: Date,
      default: null
    },
    gender: {
      type: String,
      enum: ["", "female", "male", "nonbinary", "prefer_not_to_say", "custom"],
      default: ""
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active"
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    savedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
      }
    ],
    savedReels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Reel"
      }
    ],
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ]
  },
  {
    timestamps: true
  }
);

userSchema.pre("save", async function handlePasswordHash(next) {
  if (!this.isModified("password")) {
    next();
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
