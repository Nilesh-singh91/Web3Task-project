// Room.tsx
// Main Watch Party Screen: coordinates YouTube video sync, role management,
// Socket.IO real-time events, and participant list.

import React, { useEffect, useRef, useState } from "react";
import socket from "../socket";
import {
  Participant,
  Role,
  SyncStatePayload,
  PlaybackPayload,
  ChangeVideoPayload,
  RoleAssignedPayload,
  ParticipantRemovedPayload,
  ErrorMessagePayload,
} from "../types";
import VideoPlayer from "../components/VideoPlayer";
import Controls from "../components/Controls";
import Participants from "../components/Participants";

interface RoomProps {
  roomId: string;
  username: string;
  onLeave: () => void;
}

export const Room: React.FC<RoomProps> = ({ roomId, username, onLeave }) => {
  const [videoId, setVideoId] = useState<string>("aqz-KE-bpKQ");
  const [playState, setPlayState] = useState<"playing" | "paused">("paused");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myUserId, setMyUserId] = useState<string>("");
  const [myRole, setMyRole] = useState<Role>("Participant");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [statusNotification, setStatusNotification] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Use a ref for myUserId so event handlers always have the latest value
  // WITHOUT needing myUserId in the useEffect dependency array (which would cause infinite loops!)
  const myUserIdRef = useRef<string>("");

  const showNotification = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(""), 4000);
  };

  useEffect(() => {
    // 1. Connect socket if disconnected
    if (!socket.connected) {
      socket.connect();
    }

    // 2. Emit join_room once
    socket.emit("join_room", { roomId, username });

    // 3. Setup Socket.IO Event Listeners
    const handleSyncState = (data: SyncStatePayload) => {
      setVideoId(data.videoId);
      setPlayState(data.playState);
      setCurrentTime(data.currentTime);
      setMyUserId(data.myUserId);
      myUserIdRef.current = data.myUserId;
      setMyRole(data.myRole);
      setParticipants(data.participants);
    };

    const handleUserJoined = (data: {
      username: string;
      userId: string;
      role: Role;
      participants: Participant[];
    }) => {
      setParticipants(data.participants);
      if (data.userId !== myUserIdRef.current) {
        showNotification(`👋 ${data.username} joined as ${data.role}`);
      }
    };

    const handleUserLeft = (data: {
      username: string;
      userId: string;
      participants: Participant[];
    }) => {
      setParticipants(data.participants);
      showNotification(`🚪 ${data.username} left the room`);
    };

    const handlePlay = (data?: PlaybackPayload) => {
      setPlayState("playing");
      if (data && typeof data.currentTime === "number") {
        setCurrentTime(data.currentTime);
      }
    };

    const handlePause = (data?: PlaybackPayload) => {
      setPlayState("paused");
      if (data && typeof data.currentTime === "number") {
        setCurrentTime(data.currentTime);
      }
    };

    const handleSeek = (data: { time: number }) => {
      setCurrentTime(data.time);
    };

    const handleChangeVideo = (data: ChangeVideoPayload) => {
      setVideoId(data.videoId);
      setPlayState(data.playState);
      setCurrentTime(data.currentTime);
      showNotification(`🎬 Video changed to ID: ${data.videoId}`);
    };

    const handleRoleAssigned = (data: RoleAssignedPayload) => {
      setParticipants(data.participants);
      if (data.userId === myUserIdRef.current) {
        setMyRole(data.role);
        showNotification(`⭐ Your role was changed to: ${data.role}`);
      } else {
        showNotification(`⭐ ${data.username} is now a ${data.role}`);
      }
    };

    const handleParticipantRemoved = (data: ParticipantRemovedPayload) => {
      setParticipants(data.participants);
      showNotification(`A participant was removed by the Host.`);
    };

    const handleRemovedByHost = (data: { message: string }) => {
      alert(data.message || "You have been removed from this room by the Host.");
      onLeave();
    };

    const handleErrorMessage = (data: ErrorMessagePayload) => {
      setErrorMessage(data.message);
      setTimeout(() => setErrorMessage(""), 5000);
    };

    socket.on("sync_state", handleSyncState);
    socket.on("user_joined", handleUserJoined);
    socket.on("user_left", handleUserLeft);
    socket.on("play", handlePlay);
    socket.on("pause", handlePause);
    socket.on("seek", handleSeek);
    socket.on("change_video", handleChangeVideo);
    socket.on("role_assigned", handleRoleAssigned);
    socket.on("participant_removed", handleParticipantRemoved);
    socket.on("removed_by_host", handleRemovedByHost);
    socket.on("error_message", handleErrorMessage);

    // Cleanup listeners when unmounting or switching rooms
    return () => {
      socket.off("sync_state", handleSyncState);
      socket.off("user_joined", handleUserJoined);
      socket.off("user_left", handleUserLeft);
      socket.off("play", handlePlay);
      socket.off("pause", handlePause);
      socket.off("seek", handleSeek);
      socket.off("change_video", handleChangeVideo);
      socket.off("role_assigned", handleRoleAssigned);
      socket.off("participant_removed", handleParticipantRemoved);
      socket.off("removed_by_host", handleRemovedByHost);
      socket.off("error_message", handleErrorMessage);
    };
  }, [roomId, username]); // IMPORTANT: Depend ONLY on roomId and username! Never on myUserId!

  const handlePlay = () => {
    socket.emit("play");
  };

  const handlePause = () => {
    socket.emit("pause");
  };

  const handleSeek = (time: number) => {
    socket.emit("seek", { time });
  };

  const handleChangeVideo = (newVideoId: string) => {
    socket.emit("change_video", { videoId: newVideoId });
  };

  const handleAssignRole = (userId: string, role: "Moderator" | "Participant") => {
    socket.emit("assign_role", { userId, role });
  };

  const handleRemoveParticipant = (userId: string) => {
    socket.emit("remove_participant", { userId });
  };

  const handleLeaveRoom = () => {
    socket.emit("leave_room");
    socket.disconnect();
    onLeave();
  };

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/?room=${roomId}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const canControl = myRole === "Host" || myRole === "Moderator";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#f8fafc",
        padding: "16px 24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header Bar */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#1e293b",
          padding: "12px 20px",
          borderRadius: "12px",
          marginBottom: "20px",
          border: "1px solid #334155",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "1.6rem" }}>🍿</span>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>
              Watch Party Room: <span style={{ color: "#38bdf8" }}>{roomId}</span>
            </h2>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>
              Logged in as: <strong>{username}</strong> ({myRole})
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={handleCopyLink}
            style={{
              background: isCopied ? "#10b981" : "#3b82f6",
              color: "#fff",
              border: "none",
              padding: "8px 14px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              transition: "background 0.2s",
            }}
          >
            {isCopied ? "✓ Link Copied!" : "📋 Copy Room Link"}
          </button>

          <button
            onClick={handleLeaveRoom}
            style={{
              background: "#ef4444",
              color: "#fff",
              border: "none",
              padding: "8px 14px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            Leave Room
          </button>
        </div>
      </header>

      {/* Notifications / Errors */}
      {statusNotification && (
        <div
          style={{
            background: "rgba(59, 130, 246, 0.2)",
            border: "1px solid #3b82f6",
            color: "#93c5fd",
            padding: "8px 14px",
            borderRadius: "8px",
            marginBottom: "16px",
            fontSize: "0.85rem",
          }}
        >
          ℹ️ {statusNotification}
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.2)",
            border: "1px solid #ef4444",
            color: "#fca5a5",
            padding: "8px 14px",
            borderRadius: "8px",
            marginBottom: "16px",
            fontSize: "0.85rem",
          }}
        >
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Main Grid: Left = Video + Controls, Right = Participants */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
          alignItems: "start",
        }}
      >
        {/* Left Column: Player & Playback Controls */}
        <div style={{ flex: "1 1 65%" }}>
          <VideoPlayer
            videoId={videoId}
            playState={playState}
            currentTime={currentTime}
            canControl={canControl}
            onLocalPlay={handlePlay}
            onLocalPause={handlePause}
            onLocalSeek={handleSeek}
          />

          <Controls
            role={myRole}
            playState={playState}
            currentTime={currentTime}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeek={handleSeek}
            onChangeVideo={handleChangeVideo}
          />
        </div>

        {/* Right Column: Participants List & Roles */}
        <div style={{ flex: "1 1 30%" }}>
          <Participants
            participants={participants}
            currentUserRole={myRole}
            currentUserId={myUserId}
            onAssignRole={handleAssignRole}
            onRemoveParticipant={handleRemoveParticipant}
          />
        </div>
      </div>
    </div>
  );
};

export default Room;