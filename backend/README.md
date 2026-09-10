# YouTube Watch Party - Backend

This is the backend server for the **YouTube Watch Party** application.
It provides real-time WebSocket communication using **Socket.IO**, HTTP endpoints using **Express**, and local persistence using **SQLite**.

---

## 📁 Files & Responsibilities

- **`src/server.js`**:
  - Sets up Express and Socket.IO servers.
  - Listens for WebSocket events (`join_room`, `play`, `pause`, `seek`, `change_video`, `assign_role`, `remove_participant`, `leave_room`).
  - **Validates permissions strictly on the server** before broadcasting any playback or role changes.
  - Broadcasts synchronized events to all connected clients in the room.

- **`src/rooms.js`**:
  - Manages in-memory state of active watch party rooms.
  - Keeps track of room video IDs, current play/pause states, playback timestamps, and participants.
  - Implements role rules:
    - First user to join a room automatically becomes **Host**.
    - Subsequent joiners become **Participants**.
    - Only **Host** can assign roles (promote to Moderator / demote to Participant) or remove participants.
    - Only **Host** and **Moderator** can play, pause, seek, or change the video.

- **`src/database.js`**:
  - Initializes SQLite (`watchparty.db`).
  - Persists rooms and logs watch party events (play, pause, seek, role assignments) for audit trails and history.

---

## 🚀 Setup & Run Instructions

1. **Navigate to the backend folder**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```
   Default configuration:
   - `PORT=5000`
   - `CLIENT_URL=http://localhost:5173`

4. **Start the backend server**:
   ```bash
   npm start
   ```
   or for development with auto-reload:
   ```bash
   npm run dev
   ```

The server will start listening at: `http://localhost:5000`
