// server.js
// Main entry point for the YouTube Watch Party Backend.
// Express HTTP server + Socket.IO WebSockets + SQLite database.

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const {
  initDatabase,
  saveRoom,
  logRoomEvent,
} = require("./database");

const {
  getRoom,
  createOrJoinRoom,
  getParticipant,
  getParticipantByUserId,
  leaveRoom,
  updatePlayState,
  updateSeekTime,
  updateVideo,
  assignRole,
  removeParticipant,
  canControlPlayback,
  isHost,
} = require("./rooms");

// Initialize SQLite database
initDatabase();

// Setup Express app
const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "online",
    name: "YouTube Watch Party Backend",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/room/:roomId", (req, res) => {
  const { roomId } = req.params;
  const room = getRoom(roomId);
  if (!room) {
    return res.status(404).json({ exists: false, message: "Room not found" });
  }
  res.json({
    exists: true,
    roomId: room.roomId,
    videoId: room.videoId,
    playState: room.playState,
    participantCount: room.participants.length,
  });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const socketRoomMap = new Map(); // socketId -> roomId

io.on("connection", (socket) => {
  console.log(`[Socket Connected] ID: ${socket.id}`);

  // EVENT: join_room
  socket.on("join_room", ({ roomId, username }) => {
    if (!roomId || !username || !username.trim()) {
      return socket.emit("error_message", {
        message: "Room ID and Username are required to join.",
      });
    }

    const cleanRoomId = roomId.trim().toUpperCase();
    const cleanUsername = username.trim();

    const { room, participant, isNewRoom, isAlreadyJoined } = createOrJoinRoom(
      cleanRoomId,
      cleanUsername,
      socket.id
    );

    socketRoomMap.set(socket.id, cleanRoomId);
    socket.join(cleanRoomId);

    // Save room in SQLite
    saveRoom(cleanRoomId, room.videoId);

    // Send current room state back to this client
    socket.emit("sync_state", {
      roomId: room.roomId,
      videoId: room.videoId,
      playState: room.playState,
      currentTime: room.currentTime,
      myUserId: participant.userId,
      myRole: participant.role,
      participants: room.participants,
    });

    // Only broadcast user_joined if they were NOT already in the room
    if (!isAlreadyJoined) {
      logRoomEvent(cleanRoomId, isNewRoom ? "ROOM_CREATED" : "USER_JOINED", {
        username: cleanUsername,
        role: participant.role,
      });

      console.log(
        `[User Joined] ${cleanUsername} (${participant.role}) -> Room: ${cleanRoomId}`
      );

      io.to(cleanRoomId).emit("user_joined", {
        username: participant.username,
        userId: participant.userId,
        role: participant.role,
        participants: room.participants,
      });
    }
  });

  // EVENT: play
  socket.on("play", () => {
    const roomId = socketRoomMap.get(socket.id);
    if (!roomId) return;

    const participant = getParticipant(roomId, socket.id);
    if (!participant) return;

    if (!canControlPlayback(participant.role)) {
      return socket.emit("error_message", {
        message: "Permission denied: Only Host or Moderator can play video.",
      });
    }

    updatePlayState(roomId, "playing");
    logRoomEvent(roomId, "PLAY", { by: participant.username });

    const room = getRoom(roomId);
    io.to(roomId).emit("play", {
      currentTime: room ? room.currentTime : 0,
    });
  });

  // EVENT: pause
  socket.on("pause", () => {
    const roomId = socketRoomMap.get(socket.id);
    if (!roomId) return;

    const participant = getParticipant(roomId, socket.id);
    if (!participant) return;

    if (!canControlPlayback(participant.role)) {
      return socket.emit("error_message", {
        message: "Permission denied: Only Host or Moderator can pause video.",
      });
    }

    updatePlayState(roomId, "paused");
    logRoomEvent(roomId, "PAUSE", { by: participant.username });

    const room = getRoom(roomId);
    io.to(roomId).emit("pause", {
      currentTime: room ? room.currentTime : 0,
    });
  });

  // EVENT: seek
  socket.on("seek", ({ time }) => {
    const roomId = socketRoomMap.get(socket.id);
    if (!roomId) return;

    const participant = getParticipant(roomId, socket.id);
    if (!participant) return;

    if (!canControlPlayback(participant.role)) {
      return socket.emit("error_message", {
        message: "Permission denied: Only Host or Moderator can seek video.",
      });
    }

    const seekTime = Number(time) || 0;
    updateSeekTime(roomId, seekTime);
    logRoomEvent(roomId, "SEEK", { by: participant.username, time: seekTime });

    io.to(roomId).emit("seek", {
      time: seekTime,
    });
  });

  // EVENT: change_video
  socket.on("change_video", ({ videoId }) => {
    const roomId = socketRoomMap.get(socket.id);
    if (!roomId) return;

    const participant = getParticipant(roomId, socket.id);
    if (!participant) return;

    if (!canControlPlayback(participant.role)) {
      return socket.emit("error_message", {
        message: "Permission denied: Only Host or Moderator can change video.",
      });
    }

    if (!videoId || typeof videoId !== "string") {
      return socket.emit("error_message", {
        message: "Please provide a valid YouTube video ID.",
      });
    }

    const cleanVideoId = videoId.trim();

    updateVideo(roomId, cleanVideoId);
    saveRoom(roomId, cleanVideoId);
    logRoomEvent(roomId, "CHANGE_VIDEO", {
      by: participant.username,
      videoId: cleanVideoId,
    });

    io.to(roomId).emit("change_video", {
      videoId: cleanVideoId,
      playState: "paused",
      currentTime: 0,
    });
  });

  // EVENT: assign_role
  socket.on("assign_role", ({ userId, role }) => {
    const roomId = socketRoomMap.get(socket.id);
    if (!roomId) return;

    const participant = getParticipant(roomId, socket.id);
    if (!participant) return;

    if (!isHost(participant.role)) {
      return socket.emit("error_message", {
        message: "Permission denied: Only the Host can assign roles.",
      });
    }

    const result = assignRole(roomId, userId, role);
    if (result.error) {
      return socket.emit("error_message", { message: result.error });
    }

    logRoomEvent(roomId, "ROLE_ASSIGNED", {
      targetUserId: userId,
      newRole: role,
    });

    io.to(roomId).emit("role_assigned", {
      userId: userId,
      username: result.participant.username,
      role: result.participant.role,
      participants: result.room.participants,
    });
  });

  // EVENT: remove_participant
  socket.on("remove_participant", ({ userId }) => {
    const roomId = socketRoomMap.get(socket.id);
    if (!roomId) return;

    const participant = getParticipant(roomId, socket.id);
    if (!participant) return;

    if (!isHost(participant.role)) {
      return socket.emit("error_message", {
        message: "Permission denied: Only the Host can remove participants.",
      });
    }

    const target = getParticipantByUserId(roomId, userId);
    if (!target) {
      return socket.emit("error_message", {
        message: "Participant not found.",
      });
    }

    const result = removeParticipant(roomId, userId);
    if (result.error) {
      return socket.emit("error_message", { message: result.error });
    }

    logRoomEvent(roomId, "PARTICIPANT_REMOVED", {
      removedUserId: userId,
      removedUsername: target.username,
    });

    const targetSocket = io.sockets.sockets.get(target.socketId);
    if (targetSocket) {
      targetSocket.emit("removed_by_host", {
        message: "You have been removed from the room by the Host.",
      });
      targetSocket.leave(roomId);
      socketRoomMap.delete(target.socketId);
    }

    io.to(roomId).emit("participant_removed", {
      userId: userId,
      participants: result.room.participants,
    });
  });

  // EVENT: leave_room
  socket.on("leave_room", () => {
    handleUserLeaving(socket);
  });

  // EVENT: disconnect
  socket.on("disconnect", () => {
    console.log(`[Socket Disconnected] ID: ${socket.id}`);
    handleUserLeaving(socket);
  });
});

function handleUserLeaving(socket) {
  const roomId = socketRoomMap.get(socket.id);
  if (!roomId) return;

  const result = leaveRoom(socket.id);
  socketRoomMap.delete(socket.id);
  socket.leave(roomId);

  if (result && result.leftParticipant) {
    const { leftParticipant, room, newHost } = result;
    console.log(`[User Left] ${leftParticipant.username} left room: ${roomId}`);

    logRoomEvent(roomId, "USER_LEFT", {
      username: leftParticipant.username,
      userId: leftParticipant.userId,
    });

    if (room && room.participants.length > 0) {
      io.to(roomId).emit("user_left", {
        username: leftParticipant.username,
        userId: leftParticipant.userId,
        participants: room.participants,
      });

      if (newHost) {
        io.to(roomId).emit("role_assigned", {
          userId: newHost.userId,
          username: newHost.username,
          role: "Host",
          participants: room.participants,
        });
      }
    }
  }
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Watch Party Backend running on port ${PORT}`);
  console.log(` HTTP API: http://localhost:${PORT}`);
  console.log(` WebSocket: ws://localhost:${PORT}`);
  console.log(`===============================================`);
});