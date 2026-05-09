const mongoose = require("mongoose");

const { REEL_CAPTION_MAX_LENGTH } = require("./reel.constants");

const videoSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      default: ""
    },
    type: {
      type: String,
      enum: ["video"],
      default: "video"
    }
  },
  {
    _id: false
  }
);

const reelSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    caption: {
      type: String,
      trim: true,
      maxlength: REEL_CAPTION_MAX_LENGTH,
      default: ""
    },
    video: {
      type: videoSchema,
      required: true
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    saves: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    commentsCount: {
      type: Number,
      default: 0
    },
    views: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.Reel || mongoose.model("Reel", reelSchema);
