// rooms.js
// In-memory room management for the YouTube Watch Party.
// Manages rooms, participants, roles, and video playback states.

const rooms = new Map();

function generateUserId() {
  return "user_" + Math.random().toString(36).substring(2, 9);
}

const DEFAULT_VIDEO_ID = "aqz-KE-bpKQ";

function getRoom(roomId) {
  return rooms.get(roomId) || null;
}

/**
 * Create a new room or join an existing one.
 * Prevents duplicate participants from the same socket.
 */
function createOrJoinRoom(roomId, username, socketId) {
  let room = rooms.get(roomId);
  let isNewRoom = false;

  if (!room) {
    isNewRoom = true;
    room = {
      roomId: roomId,
      videoId: DEFAULT_VIDEO_ID,
      playState: "paused",
      currentTime: 0,
      participants: [],
    };
    rooms.set(roomId, room);
  }

  // IDEMPOTENCY CHECK:
  // Check if this socket is already registered in this room
  const existingIndex = room.participants.findIndex((p) => p.socketId === socketId);
  if (existingIndex !== -1) {
    const existing = room.participants[existingIndex];
    existing.username = username.trim();
    return { room, participant: existing, isNewRoom: false, isAlreadyJoined: true };
  }

  // If this is the first participant in the room, make them Host
  const role = room.participants.length === 0 ? "Host" : "Participant";

  const participant = {
    userId: generateUserId(),
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

      // If the Host left, pass the Host role to the next participant (if any)
      if (leftParticipant.role === "Host" && room.participants.length > 0) {
        const modIndex = room.participants.findIndex((p) => p.role === "Moderator");
        if (modIndex !== -1) {
          room.participants[modIndex].role = "Host";
          newHost = room.participants[modIndex];
        } else {
          room.participants[0].role = "Host";
          newHost = room.participants[0];
        }
      }

      if (room.participants.length === 0) {
        rooms.delete(roomId);
      }

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
  return room;
}

function updateSeekTime(roomId, time) {
  const room = rooms.get(roomId);
  if (!room) return null;

  room.currentTime = time;
  return room;
}

function updateVideo(roomId, videoId) {
  const room = rooms.get(roomId);
  if (!room) return null;

  room.videoId = videoId;
  room.playState = "paused";
  room.currentTime = 0;
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
