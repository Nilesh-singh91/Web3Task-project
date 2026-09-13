// App.tsx
// Main application controller managing views (Home vs Room) and room routing.

import React, { useState, useEffect } from "react";
import Home from "./pages/Home";
import Room from "./pages/Room";

export const App: React.FC = () => {
  const [roomId, setRoomId] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [initialRoomParam, setInitialRoomParam] = useState<string>("");

  // Check URL on load for room parameter and restore session from localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let targetRoom = urlParams.get("room")?.trim().toUpperCase() || "";

    if (!targetRoom) {
      const pathParts = window.location.pathname.split("/").filter(Boolean);
      if (pathParts[0] === "room" && pathParts[1]) {
        targetRoom = pathParts[1].trim().toUpperCase();
      }
    }

    let savedSession: { roomId?: string; username?: string; userId?: string } | null = null;
    try {
      const savedRaw = localStorage.getItem("watchparty_session");
      if (savedRaw) {
        savedSession = JSON.parse(savedRaw);
      }
    } catch (e) {}

    if (targetRoom) {
      setRoomId(targetRoom);
      setInitialRoomParam(targetRoom);
      if (savedSession && savedSession.roomId === targetRoom && savedSession.username) {
        setUsername(savedSession.username);
      }
    } else if (savedSession && savedSession.roomId && savedSession.username) {
      setRoomId(savedSession.roomId);
      setUsername(savedSession.username);
      setInitialRoomParam(savedSession.roomId);
      window.history.replaceState({}, "", `?room=${savedSession.roomId}`);
    }
  }, []);

  const handleJoinRoom = (selectedRoomId: string, enteredUsername: string) => {
    setRoomId(selectedRoomId);
    setUsername(enteredUsername);
    window.history.pushState({}, "", `?room=${selectedRoomId}`);
  };

  const handleLeaveRoom = () => {
    try {
      localStorage.removeItem("watchparty_session");
    } catch (e) {}
    setRoomId("");
    setUsername("");
    setInitialRoomParam("");
    window.history.pushState({}, "", window.location.pathname);
  };

  // If both roomId and username are present, open Room
  if (roomId && username) {
    return <Room roomId={roomId} username={username} onLeave={handleLeaveRoom} />;
  }

  // Otherwise show Home (with pre-filled room code if present)
  return <Home initialRoomId={initialRoomParam} onJoinRoom={handleJoinRoom} />;
};

export default App;