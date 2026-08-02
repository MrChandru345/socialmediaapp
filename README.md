# 🚀 Curator — Full-Stack Real-Time Social Media Platform

A modern, production-grade full-stack social media web application built with the **MERN Stack (MongoDB, Express.js, React.js, Node.js)**, **WebSockets (Socket.io)** for real-time messaging, and **Cloudinary** for scalable media storage.

Featuring interactive client-side image cropping, audio voice messages, portrait reels, 24-hour expiring stories and notes, granular private account privacy guards, and real-time social engagement.

---

## 🌟 Core Features & Highlights

### 🔒 1. Advanced Security & Privacy Controls
* **JWT Authentication**: Secure stateless session management using JSON Web Tokens (Access Tokens & Refresh Token rotation) with `bcrypt` password encryption.
* **Private Account Protection**: When an account is private, non-followers are strictly blocked from seeing posts, reels, feed updates, or followers/following lists (`403 Forbidden` guard).
* **Followers-Only Post Visibility**: Content creators can choose between `Public` or `Followers-Only` visibility on individual posts. Followers-only posts are automatically filtered out from non-followers on Feed, Explore, Profile, and direct post URL routes.
* **Remove Follower**: Profile owners can remove any user from their followers list with a single click `(×)` — updating follower graphs and cleaning up notification records automatically.
* **Self-Follow Prevention**: Smart UI & backend rules prevent users from following or showing follow buttons on their own account.

### 📸 2. Posts, Reels & Rich Media
* **Interactive Image Cropping**: Client-side image editor powered by `react-easy-crop` and HTML5 Canvas API. Crops and compresses photos locally before upload, saving server bandwidth and eliminating aspect-ratio jumps.
* **Portrait Video Reels**: Full-screen video reels feed with Intersection Observer auto-play/pause on viewport scroll.
* **Hover Overlay Clean Grid**: Sleek grid layout on Profile and Explore pages, displaying clean image/video thumbnails.
* **Emoji Picker**: Interactive emoji picker popover with click-outside listener integrated directly into post creation and comment modals.

### 💬 3. Direct Messaging & Real-Time Chat
* **Instant Messaging**: Powered by Socket.io for instantaneous message delivery, unread message badges, and online/offline presence status.
* **Voice Notes / Audio Recording**: Built-in voice recorder allowing users to record and send audio messages directly inside direct chats.
* **Shared Post Lightbox**: Embedded post/reel share cards inside chat messages with full-screen media lightbox view.
* **Clean Chat Layout**: Custom scrollbar styling removing default ugly browser scrollbar boxes for an ultra-sleek UI.

### ⌛ 4. Ephemeral Stories & 24-Hour Notes
* **24-Hour Expiring Stories**: Photo/video stories automatically expire and auto-delete after 24 hours using MongoDB TTL indexes.
* **24-Hour Chat Notes**: Short status notes displayed at the top of the message inbox that auto-expire after 24 hours.
* **Story View Tracking**: Real-time viewer counter and viewers list visible exclusively to the story creator.

### 💬 5. Commenting & Content Ownership
* **Post & Reel Owner Deletion Control**: Comments can be deleted by either the **comment author** OR the **owner of the post/reel**, giving content creators full moderation authority over their content.
* **Nested Comment Counter**: Live sync of comment counts across feeds, profile modals, and detail pages.

### 🔄 6. Modern UX Features
* **Multi-Account Switcher**: Seamlessly switch between multiple logged-in accounts directly from the top bar dropdown or mobile menu drawer.
* **Browser Pull-to-Refresh & Topbar Refresh**: Dedicated browser refresh gesture and top bar refresh icon (`window.location.reload()`) to instantly sync fresh server state.
* **Responsive Mobile Design**: Tailored layout supporting desktop glassmorphism cards and bottom navigation bar on mobile screen viewports.

---

## 🛠️ Tech Stack

### Frontend
* **Framework**: React 18 (Hooks, Router v6, Context API)
* **Build Tool**: Vite v5
* **Styling**: Custom Vanilla CSS with CSS Variables, Dark Glassmorphism aesthetic, and Responsive Grid layouts
* **Real-time Client**: Socket.io-client
* **Processing**: `react-easy-crop`, HTML5 Canvas API
* **Icons**: Google Material Symbols & Lucide Icons

### Backend
* **Runtime**: Node.js & Express.js (Modular Domain-Driven MVC Architecture)
* **Database**: MongoDB & Mongoose ORM (with TTL indexes for auto-expiration)
* **Real-time Engine**: Socket.io Server
* **Media Storage**: Cloudinary SDK (Direct buffer stream uploads)
* **Authentication**: JWT (JSON Web Tokens), `bcryptjs`, CORS, Cookie-parser

---

## 📂 Project Architecture

```
Socialmediaapp/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, Cloudinary, and Environment configuration
│   │   ├── middleware/      # Auth protection, Error handling, Upload limits
│   │   ├── modules/         # Domain modules
│   │   │   ├── admin/       # System administration APIs
│   │   │   ├── auth/        # Login, Signup, Refresh Token, Password Reset
│   │   │   ├── chat/        # Direct messaging, Audio notes, Socket.io handlers
│   │   │   ├── comment/     # Post & Reel comments & moderation
│   │   │   ├── follow/      # Follow graph, requests, and follower removal
│   │   │   ├── notification/# Real-time notification socket push
│   │   │   ├── post/        # Post creation, visibility filtering, Likes, Saves
│   │   │   ├── reel/        # Reel video uploading & player feeds
│   │   │   ├── story/       # 24h Expiring stories & viewer lists
│   │   │   └── user/        # Profiles, Privacy settings, Search, Suggestions
│   │   ├── utils/           # Data sanitizers, Helpers, Logger
│   │   ├── app.js           # Express app setup & route mounting
│   │   └── server.js        # HTTP & Socket.io server startup
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── assets/          # Shared graphic assets & logos
    │   ├── components/      # UI components (auth, post, profile, chat, reel, story)
    │   ├── context/         # AuthContext & SocketContext state providers
    │   ├── hooks/           # Custom React hooks (useAuth)
    │   ├── pages/           # Page views (Home, Profile, Explore, Reels, Chat, Settings, Admin)
    │   ├── services/        # Axios API service handlers
    │   ├── utils/           # Helper functions & canvas tools
    │   ├── App.jsx          # Protected & public routing
    │   ├── main.jsx         # React application entry point
    │   └── styles.css       # Unified design system & global CSS tokens
    └── package.json
```

---

## 🚀 Getting Started Locally

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [MongoDB](https://www.mongodb.com/) (Local server or MongoDB Atlas URI)
* [Cloudinary](https://cloudinary.com/) account (Cloud Name, API Key, API Secret)

---

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/MrChandru345/socialmediaapp.git
cd socialmediaapp

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
```

---

### 2. Environment Setup

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/socialmediaapp
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d
STORY_RETENTION_HOURS=24
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

---

### 3. Running the Application

**Start the Backend Dev Server:**
```bash
cd backend
npm run dev
# Backend server runs on http://localhost:5000
```

**Start the Frontend Dev Server:**
```bash
cd frontend
npm run dev
# Frontend web app runs on http://localhost:5173 (Vite)
```

Open `http://localhost:5173` in your web browser to use the application! 🎉

---

## 🔒 Security & Privacy Practices
- **Password Security**: Passwords are hashed using `bcrypt` (10 rounds) and excluded by default in Mongoose user queries (`select: false`).
- **Data Protection**: All private account queries sanitize user information, excluding followers, posts, and internal IDs for unauthorized viewers.
- **Input Sanitization**: User inputs (captions, comments, bio) are trimmed and validated to protect against injection.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).