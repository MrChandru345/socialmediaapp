const mongoose = require("mongoose");
const env = require("./src/config/env");
const Reel = require("./src/modules/reel/reel.model");

async function debug() {
  await mongoose.connect(env.mongoUri);
  console.log("Connected to MongoDB");

  try {
    const reel = new Reel({
      author: new mongoose.Types.ObjectId(), // Fake ID
      caption: "Test Reel",
      video: {
        url: "https://res.cloudinary.com/demo/video/upload/dog.mp4",
        publicId: "dog",
        type: "video"
      }
    });

    await reel.validate();
    console.log("Validation SUCCESS!");
  } catch (error) {
    console.error("Validation FAILED:");
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

debug();
