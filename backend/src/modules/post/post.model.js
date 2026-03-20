const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
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
      enum: ["image", "video"],
      default: "image"
    }
  },
  {
    _id: false
  }
);

const postSchema = new mongoose.Schema(
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
      maxlength: 500,
      default: ""
    },
    media: [mediaSchema],
    visibility: {
      type: String,
      enum: ["public", "followers"],
      default: "public"
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
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.Post || mongoose.model("Post", postSchema);
