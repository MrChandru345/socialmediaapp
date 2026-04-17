const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true // One user, one active note
  },
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 60
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Expire after 24 hours (86400 seconds)
  }
});

const Note = mongoose.model("Note", noteSchema);

module.exports = Note;
