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

const storySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    media: {
      type: mediaSchema,
      required: true
    },
    caption: {
      type: String,
      trim: true,
      maxlength: 160,
      default: ""
    },
    viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.Story || mongoose.model("Story", storySchema);
