# 🍿 YouTube Watch Party System

A simple, real-time **YouTube Watch Party** web application. Multiple users can join a watch party room and enjoy synchronized YouTube video playback with role-based access control.

---

## 🌐 Live URL
- **Production URL**: `https://your-watch-party.onrender.com` *(Replace with your deployed URL)*

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Tech Stack](#-tech-stack)
4. [Architecture & How It Works](#-architecture--how-it-works)
5. [Folder Structure](#-folder-structure)
6. [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
7. [WebSocket Events Guide](#-websocket-events-guide)
8. [YouTube Sync & Infinite Loop Prevention](#-youtube-sync--infinite-loop-prevention)
9. [Local Setup & Installation](#-local-setup--installation)
10. [Step-by-Step Testing Guide](#-step-by-step-testing-guide)
11. [Deployment Guide](#-deployment-guide)
12. [Interview Questions & Explanations](#-interview-questions--explanations)

---

## 🚀 Project Overview

In traditional video sharing, everyone watches separately at different times. **YouTube Watch Party** solves this by connecting everyone in a room through WebSockets:
- When the **Host** or **Moderator** presses **Play**, **Pause**, **Seeks**, or **Changes the video**, everyone in the room sees the action immediately in real time.
- Joiners enter as **Participants** (view-only mode) so random users cannot interrupt playback.
- The **Host** can promote trusted participants to **Moderators** or remove disruptive users.

---

## ✨ Key Features

- ⚡ **Real-time Video Sync**: Play, pause, scrub/seek, and video changes are synchronized across all connected users with sub-second latency.
- 🏠 **Room-based Model**: Create a room with an automatic code or join any existing room.
- 👥 **Role-Based Permissions**:
  - **Host**: Room creator. Full control over playback, roles, and participant removals.
  - **Moderator**: Assigned by Host. Can control playback and change video.
  - **Participant**: View-only mode. Screen automatically syncs with the room.
- 🛡️ **Server-Side Security**: Permissions are checked on the server (Node.js). If a participant tampers with frontend code to send a `play` or `change_video` command, the backend rejects it with an error.
- 🎥 **YouTube IFrame API Integration**: Embeds YouTube directly without requiring complex third-party media players.
- 🔄 **Loop-Prevention Mechanism**: Prevents echoing events between YouTube's internal player and the WebSocket server.
- 💾 **SQLite Persistence**: Stores created rooms and audit logs for events.

---

## 🛠️ Tech Stack

| Layer | Technology | Why We Chose It |
|---|---|---|
| **Frontend** | React (TypeScript + Vite) | Fast, modular component structure, strong type safety |
| **Backend** | Node.js + Express | Lightweight, fast event-driven HTTP server |
| **Real-time** | Socket.IO | Reliable WebSocket communication with fallback & auto-reconnect |
| **Database** | SQLite3 | Zero-configuration SQL database, perfect for local storage and persistence |
| **Video** | YouTube IFrame Player API | Official API from Google to control YouTube videos programmatically |

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
│   ├── vite.config.ts
│   ├── .env
│   └── .env.example
│
├── .gitignore
└── README.md
```

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

> **Crucial Rule**: The frontend hides/disables controls for Participants, but **the backend independently validates the user's role** in `server.js` before executing any action. If an unauthorized client manually fires a WebSocket event, the server blocks it and emits an error message.

---

## 📡 WebSocket Events Guide

### Client to Server (Emit):
- `join_room` (`{ roomId, username }`): User joins room (Host if first, Participant if existing).
- `leave_room` (`{}`): User leaves room.
- `play` (`{}`): Requests playback to start.
- `pause` (`{}`): Requests playback to pause.
- `seek` (`{ time }`): Seeks to timestamp in seconds.
- `change_video` (`{ videoId }`): Changes the YouTube video ID and resets time to 0.
- `assign_role` (`{ userId, role }`): Host promotes or demotes a participant.
- `remove_participant` (`{ userId }`): Host kicks a participant.

### Server to Client (Listen):
- `sync_state` (`{ roomId, videoId, playState, currentTime, myUserId, myRole, participants }`): Initial state sent to a newly joined client.
- `user_joined` (`{ username, userId, role, participants }`): Broadcast when someone joins.
- `user_left` (`{ username, userId, participants }`): Broadcast when someone leaves or disconnects.
- `play` (`{ currentTime }`): Broadcast when video starts playing.
- `pause` (`{ currentTime }`): Broadcast when video pauses.
- `seek` (`{ time }`): Broadcast when video scrubs to new time.
- `change_video` (`{ videoId, playState, currentTime }`): Broadcast when video changes.
- `role_assigned` (`{ userId, username, role, participants }`): Broadcast when role changes.
- `participant_removed` (`{ userId, participants }`): Broadcast when participant is kicked.
- `removed_by_host` (`{ message }`): Sent directly to the kicked user.
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

## 💻 Local Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher)
- npm (installed with Node)

---

### Step 1: Clone or Navigate to Project
```bash
cd C:\Users\niles\Desktop\web3task
```

---

### Step 2: Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the backend server:
   ```bash
   npm start
   ```
   The backend will run at: `http://localhost:5000`

*(To run automated tests on the backend at any time: `npm test`)*

---

### Step 3: Frontend Setup
1. Open a **second terminal** and navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   The frontend will run at: `http://localhost:5173`

---

## 🧪 Step-by-Step Testing Guide

### Test with Two Browser Tabs:
1. Open **Tab 1** (`http://localhost:5173`):
   - Under **Create a Party**, enter Name: `Nilesh`
   - Click **Create Room & Join as Host**.
   - You will see the Room Page with your Role: **HOST**.
   - Note down the 6-character Room Code (e.g. `ABC123`) or click **📋 Copy Room Link**.

2. Open **Tab 2** (`http://localhost:5173` or paste the copied link):
   - Under **Join a Party**, enter the Room Code (e.g. `ABC123`) and Name: `Rahul`.
   - Click **Join Watch Party**.
   - Notice Rahul joins with Role: **PARTICIPANT**.
   - In Tab 1 (Host), you immediately see Rahul appear in the **Participants list**.

3. **Test Play/Pause Sync**:
   - On Tab 1 (Host), click **▶ Play**.
   - Look at Tab 2: The video on Tab 2 immediately starts playing in sync!
   - On Tab 1 (Host), click **⏸ Pause**.
   - Look at Tab 2: The video pauses simultaneously.

4. **Test Seek Sync**:
   - On Tab 1 (Host), click **+10s ⏩**.
   - Look at Tab 2: The video skips forward by 10 seconds.

5. **Test Changing Video**:
   - On Tab 1 (Host), paste any YouTube URL (e.g. `https://www.youtube.com/watch?v=M7lc1UVf-VE`) or ID (`M7lc1UVf-VE`) in the input and click **Change Video**.
   - Both Tab 1 and Tab 2 switch to the new video simultaneously!

6. **Test Role Elevation (Promote to Moderator)**:
   - On Tab 1 (Host), locate `Rahul` in the Participants list and click **Make Moderator**.
   - Tab 2 (Rahul) role badge immediately turns blue: **MODERATOR**.
   - Now on Tab 2, playback control buttons appear! Rahul can now Play and Pause for everyone.

7. **Test Participant Restriction**:
   - On Tab 1 (Host), click **Make Participant** on Rahul.
   - Tab 2 (Rahul) controls disappear, returning to view-only mode.

8. **Test Remove Participant**:
   - On Tab 1 (Host), click **Remove** next to Rahul.
   - Tab 2 immediately alerts: *"You have been removed from the room by the Host"* and returns to the Home page.
   - Tab 1 updates the participant list.

---

## 🚀 Deployment Guide

### Deploying on Render (Free & Fast)
1. **Backend (Web Service)**:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Root Directory: `backend`
   - Environment Variables:
     - `PORT=5000`
     - `CLIENT_URL=https://your-frontend.vercel.app` (or `*`)

2. **Frontend (Static Site / Vercel / Netlify)**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Root Directory: `frontend`
   - Environment Variables:
     - `VITE_BACKEND_URL=https://your-backend.onrender.com`

---

## 💡 Interview Questions & Explanations

Here are the key technical concepts explained in simple English so you can ace your intern interview:

#### 1. Why use WebSockets / Socket.IO instead of normal HTTP REST APIs?
> *"HTTP is request-response: the client asks and the server answers. But in a watch party, when the host pauses, the server must push that update to all other users immediately without them repeatedly polling. WebSockets maintain an open, bidirectional connection, enabling instant sub-second synchronization."*

#### 2. How did you prevent the YouTube player infinite loop?
> *"When a remote 'play' event arrives from the server, we set a flag `isRemoteActionRef = true` and programmatically trigger `player.playVideo()`. When YouTube's `onStateChange` listener fires, it checks this flag. If true, it knows the action was initiated remotely, resets the flag, and suppresses emitting another event back to the server."*

#### 3. Why validate permissions on the backend if the UI already hides buttons?
> *"Frontend restrictions are for user experience, not security. Anyone can open Chrome DevTools, inspect the JavaScript, or execute `socket.emit('change_video')` directly. The backend must always verify that the sender's role is Host or Moderator before processing the request."*

#### 4. How are roles managed?
> *"When the first user creates a room, they are assigned the 'Host' role. All subsequent users joining that room code receive 'Participant'. The Host can promote Participants to 'Moderator' or demote them. If a Host leaves, the server automatically promotes the next participant to prevent an orphaned room."*