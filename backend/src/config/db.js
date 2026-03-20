const mongoose = require("mongoose");

const env = require("./env");
const logger = require("../utils/logger");

async function connectDb() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(env.mongoUri, {
      autoIndex: !env.isProduction
    });

    logger.info("MongoDB connected", { uri: env.mongoUri });
    return mongoose.connection;
  } catch (error) {
    logger.error("MongoDB connection failed", { error: error.message });
    throw error;
  }
}

async function disconnectDb() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
  logger.info("MongoDB disconnected");
}

module.exports = {
  connectDb,
  disconnectDb,
  mongoose
};
