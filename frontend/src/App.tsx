// App.tsx
// Main application controller managing views (Home vs Room) and room routing.

import React, { useState, useEffect } from "react";
import Home from "./pages/Home";
import Room from "./pages/Room";

export const App: React.FC = () => {
  const [roomId, setRoomId] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [initialRoomParam, setInitialRoomParam] = useState<string>("");

  // Check URL on load for room parameter (e.g. ?room=XYZ123 or /room/XYZ123)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get("room");

    if (roomParam) {
      const cleanParam = roomParam.trim().toUpperCase();
      setRoomId(cleanParam);
      setInitialRoomParam(cleanParam);
    } else {
      const pathParts = window.location.pathname.split("/").filter(Boolean);
      if (pathParts[0] === "room" && pathParts[1]) {
        const cleanParam = pathParts[1].trim().toUpperCase();
        setRoomId(cleanParam);
        setInitialRoomParam(cleanParam);
      }
    }
  }, []);

  const handleJoinRoom = (selectedRoomId: string, enteredUsername: string) => {
    setRoomId(selectedRoomId);
    setUsername(enteredUsername);
    window.history.pushState({}, "", `?room=${selectedRoomId}`);
  };

  const handleLeaveRoom = () => {
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