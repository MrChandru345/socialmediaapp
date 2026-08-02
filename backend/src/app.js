const cors = require("cors");
const express = require("express");
const morgan = require("morgan");

const env = require("./config/env");
const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/user/user.routes");
const postRoutes = require("./modules/post/post.routes");
const commentRoutes = require("./modules/comment/comment.routes");
const followRoutes = require("./modules/follow/follow.routes");
const chatRoutes = require("./modules/chat/chat.routes");
const notificationRoutes = require("./modules/notification/notification.routes");
const storyRoutes = require("./modules/story/story.routes");
const reelRoutes = require("./modules/reel/reel.routes");
const adminRoutes = require("./modules/admin/admin.routes");
const {
  errorHandler,
  notFoundHandler,
} = require("./middleware/error.middleware");

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.clientOrigin === "*" || env.clientOrigin === origin) {
        return callback(null, true);
      }
      if (origin.endsWith(".vercel.app") || origin.endsWith(".onrender.com") || origin.includes("localhost")) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.isProduction ? "combined" : "dev"));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Social Media App backend is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "socialmediaapp-backend",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/reels", reelRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
