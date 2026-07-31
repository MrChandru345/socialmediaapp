# 🚀 Full-Stack Real-Time Social Media Platform

An advanced, production-ready full-stack social media application. Built using the **MERN Stack (MongoDB, Express, React, Node.js)** and integrated with **WebSockets (Socket.io)** for instantaneous, real-time messaging and notifications.

---

## 🌟 Key Engineering Achievements

### ✂️ Professional Client-Side Image Cropping Editor
* **Challenge**: Uploading raw, uncompressed high-resolution images consumes massive backend bandwidth, slows page loads, and causes unaligned layout grids.
* **Solution**: Engineered a multi-step creation flow utilizing `react-easy-crop` to let users drag, zoom, and frame images interactively. When done, a custom JavaScript canvas operation extracts and exports the high-resolution cropped portion locally as a compressed JPEG blob, completely bypassing raw image uploads and saving server CPU cycles.

### 📐 Cumulative Layout Shift (CLS) Optimization
* **Challenge**: Dynamic feeds with multi-aspect ratio images (1:1, 4:5, 1.91:1) cause jarring page jumps (layout shifts) as media loads, lowering the Core Web Vitals score.
* **Solution**: Implemented dynamic aspect-ratio extraction on media load. The client registers the natural dimensions of images and videos on load and dynamically locks the wrapper container's CSS `aspectRatio` property. This reserves the layout footprint before media rendering, achieving zero layout shift.

### 🎬 Viewport-Aware Video Feed (Intersection Observer)
* **Challenge**: Playing multiple video posts simultaneously drains browser memory, increases resource conflicts, and degrades page performance.
* **Solution**: Utilized the browser's native `Intersection Observer API` to track viewport visibility of video posts and reels. Videos dynamically play when intersecting $>50\%$ of the screen and pause when scrolling out of bounds. Interconnected sound toggles sync global audio states (mute/unmute) across the entire session.

### 💬 Real-Time Messaging & Activity Sync (Socket.io)
* **Challenge**: User actions like follow requests, follow backs, direct messages, and notification counts require real-time synchronization without taxing the database through continuous REST polling.
* **Solution**: Built an event-driven server backend on WebSockets. User-specific socket channels push instant notifications (likes, comments, followers) and messages to recipients, maintaining active user presence indicators globally.

---

## 🛠️ Tech Stack & Architecture

### Frontend
* **Core**: React.js (hooks, single-page routing)
* **Styling**: Vanilla CSS (Tailwind variables, glassmorphism, responsive desktop & mobile grids)
* **State**: Context API (Auth, Socket session variables)
* **Client-Side Processing**: `react-easy-crop`, HTML5 Canvas API
* **Icons**: Lucide React & Google Material Symbols

### Backend
* **Runtime & Framework**: Node.js & Express.js (Modular MVC architecture)
* **Database**: MongoDB & Mongoose ORM
* **Real-time Engine**: Socket.io
* **Storage Provider**: Cloudinary SDK (Direct-to-cloud asset uploads)
* **Security**: JWT tokens, HTTPOnly cookies, Bcrypt password hashing

---

## 🔐 System Architecture & Core Features

### 1. Authentication & Security
* User registration and login utilizing encrypted passwords (Bcrypt).
* Secure stateless session management using JSON Web Tokens (JWT).
* Protected client routes and middleware-level route protection on backend endpoints.

### 2. User Profiles & Follow Network
* Custom user profiles featuring follower/following lists, grid metrics, locations, and bios.
* Real-time Follow/Follow Back toggles.
* Follow back notifications are automatically customized based on reciprocal follow status.

### 3. Infinite Feed & Engagement
* Chronologically sorted dynamic feeds with infinite scrolling/pagination support.
* Likes and nested comments threads with real-time DOM updates.
* Bookmark / Save post lists saved to database.

### 4. Chat & Online Presence
* Real-time peer-to-peer chat logs.
* Visual bubble indicators for unread message counts.
* Real-time online/offline presence tracking synced across profiles and direct message lists.

### 5. Reels & Stories
* Portrait-mode reels with infinite scrolling playback.
* Stories system with auto-expiration (stories are deleted automatically after 24 hours).

---

## 📂 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection and system configs
│   │   ├── middleware/      # Auth and error handler middlewares
│   │   ├── modules/         # Modular backend domains (user, post, chat, etc.)
│   │   │   ├── chat/        # Socket connection and messaging modules
│   │   │   ├── follow/      # Follow graph logic
│   │   │   └── notification/# Notification processing & triggers
│   │   └── utils/           # Help functions and sanitizers
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/      # Shared structural components (post, profile, chat)
    │   ├── hooks/           # Custom Auth and API hooks
    │   ├── services/        # Service-layer files for REST endpoints
    │   ├── utils/           # Canvas crop helpers and UI utilities
    │   ├── App.jsx          # Route controllers
    │   └── styles.css       # Core global design tokens & custom utility classes
    └── package.json
```

---

## 🚀 Setup & Local Execution

### Prerequisites
* [Node.js](https://nodejs.org/) installed locally (v18+ recommended)
* MongoDB connection URI
* Cloudinary API keys

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/MrChandru345/socialmediaapp.git
cd socialmediaapp

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Backend Configuration
Create a `.env` file in the `backend` folder:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_signature_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### 3. Run Dev Servers
**Start Backend Server:**
```bash
cd backend
npm run dev # Starts on http://localhost:5000
```

**Start Frontend Server:**
```bash
cd frontend
npm run dev # Starts on http://localhost:5173 (Vite)
```

---

## 📌 Roadmap & Future Additions
* **Group Conversations**: Group DM spaces with dynamic roles.
* **Encrypted Messaging**: End-to-end encryption for peer-to-peer sockets.
* **Media Filters**: WebGL shader integration to adjust picture tones.
* **WebRTC Video Calls**: Real-time peer connections for direct audio/video calling.