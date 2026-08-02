const logger = require("../utils/logger");
const { deleteExpiredStories } = require("../modules/story/story.service");

function startDeleteExpiredStoriesJob(intervalMs = 30 * 60 * 1000) {
  const timer = setInterval(async () => {
    try {
      const result = await deleteExpiredStories();
      logger.info("Expired story cleanup completed", result);
    } catch (error) {
      logger.error("Expired story cleanup failed", { error: error.message });
    }
  }, intervalMs);

  if (typeof timer.unref === "function") {
    timer.unref();
  }

  return timer;
}

module.exports = {
  startDeleteExpiredStoriesJob
};
