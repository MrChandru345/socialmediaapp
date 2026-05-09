const mongoose = require("mongoose");
const env = require("./src/config/env");
const { getReels } = require("./src/modules/reel/reel.service");

async function debug() {
  await mongoose.connect(env.mongoUri);
  console.log("Connected to MongoDB");

  try {
    const result = await getReels({}, null);
    console.log("Success! Items count:", result.items.length);
  } catch (error) {
    console.error("FAILED with error:");
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

debug();
