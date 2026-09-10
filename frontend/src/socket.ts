// socket.ts
// Socket.IO client initialization

import { io } from "socket.io-client";

// Read backend URL from environment variables or default to localhost:5000
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// Create a single Socket.IO client instance
// autoConnect is false so we connect when user enters a room
export const socket = io(BACKEND_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
});

export default socket;
