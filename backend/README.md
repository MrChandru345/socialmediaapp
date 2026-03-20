# Social Media App Backend

Express + MongoDB backend scaffold for the social media platform.

## Included

- Modular feature folders for auth, users, posts, comments, follows, chat, notifications, stories, reels, and admin
- JWT authentication middleware
- Socket.IO setup for chat and presence
- Cloudinary-ready upload helpers
- Story cleanup background job
- Smoke tests and a build validation script

## Quick Start

```bash
npm install
npm run build
npm test
npm run dev
```

## Default API Prefix

`/api`

## Main Endpoints

- `/api/auth`
- `/api/users`
- `/api/posts`
- `/api/comments`
- `/api/follows`
- `/api/chat`
- `/api/notifications`
- `/api/stories`
- `/api/reels`
- `/api/admin`
