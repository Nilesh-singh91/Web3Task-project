// rooms.js
// In-memory room management for the YouTube Watch Party.
// Manages rooms, participants, roles, and video playback states.

const rooms = new Map();

function generateUserId() {
  return "user_" + Math.random().toString(36).substring(2, 9);
}

const DEFAULT_VIDEO_ID = "M7lc1UVf-VE";

function getRoom(roomId) {
  return rooms.get(roomId) || null;
}

/**
 * Calculate current room time dynamically if video is playing
 */
function getCurrentRoomTime(room) {
  if (!room) return 0;
  if (room.playState === "playing" && room.lastUpdated) {
    const elapsed = (Date.now() - room.lastUpdated) / 1000;
    return Math.floor(room.currentTime + elapsed);
  }
  return Math.floor(room.currentTime || 0);
}

/**
 * Create a new room or join an existing one.
 * Prevents duplicate participants from the same socket.
 * Supports reconnecting user with existingUserId to preserve Host/Participant role.
 */
function createOrJoinRoom(roomId, username, socketId, existingUserId = null) {
  let room = rooms.get(roomId);
  let isNewRoom = false;

  if (!room) {
    isNewRoom = true;
    room = {
      roomId: roomId,
      videoId: DEFAULT_VIDEO_ID,
      playState: "paused",
      currentTime: 0,
      lastUpdated: Date.now(),
      hostUserId: null,
      participants: [],
    };
    rooms.set(roomId, room);
  }

  // IDEMPOTENCY / RECONNECTION CHECK:
  // Check if this user is already in the room by existingUserId or socketId
  let existingIndex = -1;
  if (existingUserId) {
    existingIndex = room.participants.findIndex((p) => p.userId === existingUserId);
  }
  if (existingIndex === -1) {
    existingIndex = room.participants.findIndex((p) => p.socketId === socketId);
  }

  if (existingIndex !== -1) {
    const existing = room.participants[existingIndex];
    existing.socketId = socketId;
    existing.username = username.trim();
    if (room.hostUserId === existing.userId) {
      existing.role = "Host";
    }
    return { room, participant: existing, isNewRoom: false, isAlreadyJoined: true };
  }

  // Role Assignment:
  // First participant in the room or returning original creator is Host
  const isFirst = room.participants.length === 0;
  const isReturningHost = existingUserId && existingUserId === room.hostUserId;
  const role = (isFirst || isReturningHost) ? "Host" : "Participant";

  const userId = existingUserId || generateUserId();

  if (role === "Host" && !room.hostUserId) {
    room.hostUserId = userId;
  }

  const participant = {
    userId: userId,
    username: username.trim(),
    role: role,
    socketId: socketId,
  };

  room.participants.push(participant);
  return { room, participant, isNewRoom, isAlreadyJoined: false };
}

function getParticipant(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  return room.participants.find((p) => p.socketId === socketId) || null;
}

function getParticipantByUserId(roomId, userId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  return room.participants.find((p) => p.userId === userId) || null;
}

function leaveRoom(socketId) {
  for (const [roomId, room] of rooms.entries()) {
    const index = room.participants.findIndex((p) => p.socketId === socketId);

    if (index !== -1) {
      const leftParticipant = room.participants[index];
      room.participants.splice(index, 1);

      let newHost = null;

      // If the Host left and other participants remain, pass the Host role
      if (leftParticipant.role === "Host" && room.participants.length > 0) {
        const modIndex = room.participants.findIndex((p) => p.role === "Moderator");
        if (modIndex !== -1) {
          room.participants[modIndex].role = "Host";
          newHost = room.participants[modIndex];
        } else {
          room.participants[0].role = "Host";
          newHost = room.participants[0];
        }
        room.hostUserId = newHost.userId;
      }

      // Do NOT delete the room immediately if participants.length === 0.
      // This ensures room video, current time, and settings persist across page refresh.
      return { room, leftParticipant, newHost };
    }
  }

  return null;
}

function updatePlayState(roomId, playState, currentTime = null) {
  const room = rooms.get(roomId);
  if (!room) return null;

  room.playState = playState;
  if (currentTime !== null && typeof currentTime === "number") {
    room.currentTime = currentTime;
  }
  room.lastUpdated = Date.now();
  return room;
}

function updateSeekTime(roomId, time) {
  const room = rooms.get(roomId);
  if (!room) return null;

  room.currentTime = time;
  room.lastUpdated = Date.now();
  return room;
}

function updateVideo(roomId, videoId) {
  const room = rooms.get(roomId);
  if (!room) return null;

  room.videoId = videoId;
  room.playState = "paused";
  room.currentTime = 0;
  room.lastUpdated = Date.now();
  return room;
}

function assignRole(roomId, targetUserId, newRole) {
  const room = rooms.get(roomId);
  if (!room) return { error: "Room not found" };

  if (newRole !== "Moderator" && newRole !== "Participant") {
    return { error: "Invalid role. Allowed roles: Moderator, Participant" };
  }

  const participant = room.participants.find((p) => p.userId === targetUserId);
  if (!participant) {
    return { error: "Participant not found" };
  }

  if (participant.role === "Host") {
    return { error: "Cannot change the Host's role" };
  }

  participant.role = newRole;
  return { participant, room };
}

function removeParticipant(roomId, targetUserId) {
  const room = rooms.get(roomId);
  if (!room) return { error: "Room not found" };

  const index = room.participants.findIndex((p) => p.userId === targetUserId);
  if (index === -1) {
    return { error: "Participant not found" };
  }

  const target = room.participants[index];
  if (target.role === "Host") {
    return { error: "Cannot remove the Host" };
  }

  room.participants.splice(index, 1);
  return { removedParticipant: target, room };
}

function canControlPlayback(role) {
  return role === "Host" || role === "Moderator";
}

function isHost(role) {
  return role === "Host";
}

module.exports = {
  getRoom,
  getCurrentRoomTime,
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
};

// In-memory room management for the YouTube Watch Party.
