# 🍿 YouTube Watch Party System

A complete, real-time **YouTube Watch Party** web application. Multiple users can join a watch party room and enjoy synchronized YouTube video playback with role-based access control.

---

## 🌐 Live Production URLs

- **Frontend (Vercel)**: [https://web3-task-project-u6b3.vercel.app](https://web3-task-project-u6b3.vercel.app)
- **Backend (Render)**: [https://web3task-project.onrender.com](https://web3task-project.onrender.com)
- **GitHub Repository**: [https://github.com/Nilesh-singh91/Web3Task-project](https://github.com/Nilesh-singh91/Web3Task-project)

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Tech Stack](#-tech-stack)
4. [Architecture & How It Works](#-architecture--how-it-works)
5. [Folder Structure](#-folder-structure)
6. [Important Files & Responsibilities](#-important-files--responsibilities)
7. [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
8. [WebSocket Events Guide](#-websocket-events-guide)
9. [Backend Permission Security](#-backend-permission-security)
10. [YouTube Sync & Infinite Loop Prevention](#-youtube-sync--infinite-loop-prevention)
11. [How To Run Locally](#-how-to-run-locally)
12. [Environment Variables](#-environment-variables)
13. [How to Test with Two Browser Tabs](#-how-to-test-with-two-browser-tabs)
14. [Deployment Architecture](#-deployment-architecture)
15. [Interview Questions & Explanations](#-interview-questions--explanations)

---

## 🚀 Project Overview

In traditional video sharing, everyone watches separately at different times. **YouTube Watch Party** connects everyone in a room through WebSockets:
- When the **Host** or **Moderator** presses **Play**, **Pause**, **Seeks**, or **Changes the video**, everyone in the room sees the action immediately in real time.
- Joiners enter as **Participants** (view-only mode) so random users cannot interrupt playback.
- The **Host** can promote trusted participants to **Moderators** or remove disruptive users.

---

## ✨ Key Features

- ⚡ **Real-time Video Sync**: Play, pause, scrub/seek, and video changes are synchronized across all connected users with sub-second latency.
- 🏠 **Room-based Model**: Create a room with an auto-generated 6-character code or join any existing room.
- 👥 **Role-Based Access Control (RBAC)**:
  - **Host**: Room creator. Full control over playback, roles, and participant removals.
  - **Moderator**: Assigned by Host. Can control playback and change video.
  - **Participant**: View-only mode. Screen automatically syncs with the room.
- 🛡️ **Strict Backend Permission Enforcement**: Permissions are checked on the server (Node.js). If a participant sends an unauthorized `play` or `change_video` event, the backend rejects it.
- 🎥 **YouTube IFrame API Integration**: Embeds YouTube directly without requiring complex third-party media players.
- 🔄 **Loop-Prevention Mechanism**: Prevents echoing events between YouTube's internal player and the WebSocket server.
- 💾 **SQLite Persistence**: Stores created rooms and audit logs for events.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React (TypeScript + Vite) | Fast, modular component structure, strong type safety |
| **Backend** | Node.js + Express | Lightweight, fast event-driven HTTP server |
| **Real-time** | Socket.IO | Reliable WebSocket communication with fallback & auto-reconnect |
| **Database** | SQLite3 | Zero-configuration SQL database for local storage and event persistence |
| **Video** | YouTube IFrame Player API | Official API to control YouTube videos programmatically |
| **Deployment** | Vercel (Frontend) + Render (Backend) | Production hosting |

---

## 🏛️ Architecture & How It Works

```
[ User A (Host) ]                     [ User B (Participant) ]
       │                                         │
       │ (1) Host clicks "Play"                  │
       ▼                                         │
[ React Frontend ]                               │
       │                                         │
       │ (2) socket.emit("play")                 │
       ▼                                         │
[ Socket.IO Server (server.js) ]                 │
       │                                         │
       │ (3) Verify role: Host/Moderator?        │
       │ (4) Update Room State: playState=playing│
       │ (5) io.to(roomId).emit("play")          │
       ├─────────────────────────────────────────┘
       │
       ▼ (6) Both clients receive "play" event
[ VideoPlayer.tsx ]
       │
       │ (7) Set isRemoteActionRef = true
       │ (8) player.playVideo()
       ▼
   Synchronized Video!
```

---

## 📂 Folder Structure

```
web3task/
├── backend/
│   ├── src/
│   │   ├── server.js        # Express app, Socket.IO server, permissions & routing
│   │   ├── rooms.js         # Room state management (participants, roles, playback)
│   │   └── database.js      # SQLite setup and logging
│   ├── test-sync.js         # Automated end-to-end sync and role test suite
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── VideoPlayer.tsx   # YouTube IFrame API wrapper with loop prevention
│   │   │   ├── Controls.tsx      # Play/Pause/Seek/Change video role-aware controls
│   │   │   └── Participants.tsx  # Participant list & Host management buttons
│   │   ├── pages/
│   │   │   ├── Home.tsx          # Create or Join room page
│   │   │   └── Room.tsx          # Main Watch Party interface
│   │   ├── socket.ts             # Socket.IO client singleton
│   │   ├── types.ts              # TypeScript interfaces (Role, Participant, RoomState)
│   │   ├── App.tsx               # Route controller (Home vs Room)
│   │   ├── main.tsx              # React DOM entry point
│   │   └── index.css             # Clean responsive styles
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vercel.json               # SPA routing rewrite for Vercel
│   ├── vite.config.ts
│   ├── .env
│   └── .env.example
│
├── render.yaml                   # Render Blueprint configuration
├── .gitignore
└── README.md
```

---

## 📄 Important Files & Responsibilities

### Backend
- **`backend/src/server.js`**:
  Initializes Express, HTTP server, and Socket.IO. Listens for all client socket events, performs strict role validation, and broadcasts sync messages to the room.
- **`backend/src/rooms.js`**:
  Keeps all active rooms in memory. Manages participants, roles, playback state, and handles idempotency (preventing duplicate joins from the same socket).
- **`backend/src/database.js`**:
  Initializes SQLite (`watchparty.db`) to record created rooms and major playback/role events.
- **`backend/test-sync.js`**:
  Automated integration test verifying all 10 core real-time synchronization flows.

### Frontend
- **`frontend/src/components/VideoPlayer.tsx`**:
  Embeds the YouTube video using `window.YT.Player`. Uses an `isRemoteActionRef` flag to suppress echoing events back to the server.
- **`frontend/src/components/Controls.tsx`**:
  Renders playback controls (Play, Pause, +/- 10s Seek, and YouTube URL/ID parser). Disables controls for Participants.
- **`frontend/src/components/Participants.tsx`**:
  Displays all connected participants with badges (`Host`, `Moderator`, `Participant`) and displays role management buttons for the Host.
- **`frontend/src/pages/Home.tsx`**:
  Landing page for creating or joining a room.
- **`frontend/src/pages/Room.tsx`**:
  Coordinates real-time Socket.IO events, sync state, and participant updates.

---

## 🔐 Role-Based Access Control (RBAC)

| Action | Host | Moderator | Participant | Checked On |
|---|:---:|:---:|:---:|:---:|
| **Play Video** | ✅ | ✅ | ❌ | Server + UI |
| **Pause Video** | ✅ | ✅ | ❌ | Server + UI |
| **Seek (Scrub Time)** | ✅ | ✅ | ❌ | Server + UI |
| **Change Video URL** | ✅ | ✅ | ❌ | Server + UI |
| **Promote to Moderator** | ✅ | ❌ | ❌ | Server + UI |
| **Demote to Participant**| ✅ | ❌ | ❌ | Server + UI |
| **Remove Participant** | ✅ | ❌ | ❌ | Server + UI |
| **Watch Video** | ✅ | ✅ | ✅ | Everyone |

---

## 📡 WebSocket Events Guide

### Client to Server (Emit):
- `join_room` (`{ roomId, username }`): User joins room (Host if creator, Participant if joiner).
- `leave_room` (`{}`): User leaves room.
- `play` (`{}`): Requests playback to start (Host/Moderator only).
- `pause` (`{}`): Requests playback to pause (Host/Moderator only).
- `seek` (`{ time }`): Seeks to timestamp in seconds (Host/Moderator only).
- `change_video` (`{ videoId }`): Changes YouTube video ID and resets time to 0 (Host/Moderator only).
- `assign_role` (`{ userId, role }`): Host promotes or demotes a participant.
- `remove_participant` (`{ userId }`): Host removes a participant.

### Server to Client (Listen):
- `sync_state` (`{ roomId, videoId, playState, currentTime, myUserId, myRole, participants }`): Initial state sent to a newly joined client.
- `user_joined` (`{ username, userId, role, participants }`): Broadcast when someone joins.
- `user_left` (`{ username, userId, participants }`): Broadcast when someone leaves or disconnects.
- `play` (`{ currentTime }`): Broadcast when video starts playing.
- `pause` (`{ currentTime }`): Broadcast when video pauses.
- `seek` (`{ time }`): Broadcast when video scrubs to new time.
- `change_video` (`{ videoId, playState, currentTime }`): Broadcast when video changes.
- `role_assigned` (`{ userId, username, role, participants }`): Broadcast when role changes.
- `participant_removed` (`{ userId, participants }`): Broadcast when participant is removed.
- `removed_by_host` (`{ message }`): Sent directly to the removed user.
- `error_message` (`{ message }`): Sent back if an action was unauthorized or invalid.

---

## 🔄 YouTube Sync & Infinite Loop Prevention

### The Problem
When the server sends a `play` event:
1. Client calls `player.playVideo()`.
2. The YouTube player changes state to `PLAYING (1)`.
3. The YouTube player triggers its own `onStateChange` callback.
4. If this callback naively sends a `play` event back to the server, an **infinite ping-pong loop** occurs!

### The Solution (in `VideoPlayer.tsx`)
We use a flag called `isRemoteActionRef`:
```ts
// When server broadcasts "play":
isRemoteActionRef.current = true;
playerRef.current.playVideo();

// In YouTube player onStateChange:
if (isRemoteActionRef.current) {
  // This was triggered by the server broadcast! Reset flag and DO NOT emit back.
  isRemoteActionRef.current = false;
  return;
}

// Only emit if the user interacted with the player directly
socket.emit("play");
```

---

## 💻 How To Run Locally

### Prerequisites
- Node.js (version 18 or higher)
- npm

### Step 1: Start Backend
```bash
cd backend
npm install
npm start
```
> Backend runs at: `http://localhost:5000`  
> *(Run automated tests anytime: `npm test`)*

### Step 2: Start Frontend
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
> Frontend runs at: `http://localhost:5173`

---

## ⚙️ Environment Variables

### Local Development
- **`backend/.env`**:
  ```env
  PORT=5000
  CLIENT_URL=http://localhost:5173
  ```
- **`frontend/.env`**:
  ```env
  VITE_BACKEND_URL=http://localhost:5000
  ```

### Production Deployment
- **Render Backend**:
  ```env
  PORT=5000
  CLIENT_URL=*
  ```
- **Vercel Frontend**:
  ```env
  VITE_BACKEND_URL=https://web3task-project.onrender.com
  ```

---

## 🧪 How to Test with Two Browser Tabs

1. **Tab 1 (Host)**:
   - Open `https://web3-task-project-u6b3.vercel.app`.
   - Enter name `Nilesh` $\rightarrow$ click **Create Room & Join as Host**.
   - Copy the 6-character Room Code.
2. **Tab 2 (Participant)**:
   - Open an incognito window at `https://web3-task-project-u6b3.vercel.app`.
   - Enter the Room Code and name `Rahul` $\rightarrow$ click **Join Watch Party**.
   - Rahul joins as **Participant** (view-only mode).
3. **Verify Playback Sync**:
   - Host clicks **▶ Play** $\rightarrow$ Participant video immediately starts playing.
   - Host clicks **⏸ Pause** $\rightarrow$ Participant video pauses.
   - Host clicks **+10s ⏩** $\rightarrow$ Participant video skips forward 10 seconds.
   - Host pastes a new YouTube URL and clicks **Change Video** $\rightarrow$ Both switch to new video.
4. **Verify Role Management**:
   - Host clicks **Make Moderator** next to Rahul $\rightarrow$ Rahul's badge turns blue and controls unlock!
   - Rahul can now Play and Pause.
   - Host clicks **Make Participant** $\rightarrow$ Rahul returns to view-only mode.
   - Host clicks **Remove** $\rightarrow$ Rahul is removed from room with an alert.

---

## 🚀 Deployment Architecture

- **Backend**: Deployed on **Render** as a Node.js Web Service from `backend/`.
- **Frontend**: Deployed on **Vercel** as a static Vite Single Page Application from `frontend/`.
- **CORS & WebSockets**: Render server allows cross-origin connections, enabling Socket.IO polling and WebSocket upgrade seamlessly.

---

