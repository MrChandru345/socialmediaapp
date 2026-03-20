const http = require("http");

const { Server } = require("socket.io");

const app = require("./app");
const env = require("./config/env");
const { connectDb } = require("./config/db");
const { startDeleteExpiredStoriesJob } = require("./jobs/deleteExpiredStories");
const { initChatSocket } = require("./modules/chat/socket");
const logger = require("./utils/logger");

async function startServer() {
  await connectDb();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: env.clientOrigin,
      credentials: true
    }
  });

  initChatSocket(io);
  startDeleteExpiredStoriesJob();

  server.listen(env.port, () => {
    logger.info(`Backend server listening on port ${env.port}`);
  });

  return { server, io };
}

if (require.main === module) {
  startServer().catch((error) => {
    logger.error("Failed to start backend server", { error: error.message });
    process.exit(1);
  });
}

module.exports = {
  startServer
};
