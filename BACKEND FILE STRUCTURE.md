backend/
│
├── src/
│   │
│   ├── config/
│   │   ├── db.js
│   │   ├── cloudinary.js
│   │   └── env.js
│   │
│   ├── modules/   🔥 (MAIN LOGIC GROUPING)
│   │
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.routes.js
│   │   │   └── auth.validation.js
│   │   │
│   │   ├── user/
│   │   │   ├── user.controller.js
│   │   │   ├── user.service.js
│   │   │   ├── user.routes.js
│   │   │   └── user.model.js
│   │   │
│   │   ├── post/
│   │   │   ├── post.controller.js
│   │   │   ├── post.service.js
│   │   │   ├── post.routes.js
│   │   │   └── post.model.js
│   │   │
│   │   ├── comment/
│   │   │   ├── comment.controller.js
│   │   │   ├── comment.service.js
│   │   │   ├── comment.routes.js
│   │   │   └── comment.model.js
│   │   │
│   │   ├── follow/
│   │   │   ├── follow.controller.js
│   │   │   ├── follow.service.js
│   │   │   └── follow.routes.js
│   │   │
│   │   ├── chat/
│   │   │   ├── chat.controller.js
│   │   │   ├── chat.service.js
│   │   │   ├── chat.routes.js
│   │   │   ├── message.model.js
│   │   │   └── socket.js   🔥 (real-time logic)
│   │   │
│   │   ├── notification/
│   │   │   ├── notification.controller.js
│   │   │   ├── notification.service.js
│   │   │   ├── notification.routes.js
│   │   │   └── notification.model.js
│   │   │
│   │   ├── story/
│   │   │   ├── story.controller.js
│   │   │   ├── story.service.js
│   │   │   ├── story.routes.js
│   │   │   └── story.model.js
│   │   │
│   │   ├── reel/
│   │   │   ├── reel.controller.js
│   │   │   ├── reel.service.js
│   │   │   ├── reel.routes.js
│   │   │   └── reel.model.js
│   │   │
│   │   └── admin/
│   │       ├── admin.controller.js
│   │       ├── admin.service.js
│   │       └── admin.routes.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── upload.middleware.js
│   │
│   ├── utils/
│   │   ├── token.js
│   │   ├── logger.js
│   │   └── helpers.js
│   │
│   ├── jobs/   🔥 (background tasks)
│   │   └── deleteExpiredStories.js
│   │
│   ├── app.js
│   └── server.js
│
├── .env
├── package.json
└── README.md