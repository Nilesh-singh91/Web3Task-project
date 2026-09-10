// Home.tsx
// Home landing page to Create or Join a Watch Party room.

import React, { useState } from "react";

interface HomeProps {
  initialRoomId?: string;
  onJoinRoom: (roomId: string, username: string) => void;
}

export const Home: React.FC<HomeProps> = ({ initialRoomId = "", onJoinRoom }) => {
  // Create Room State
  const [createUsername, setCreateUsername] = useState("");

  // Join Room State (prefilled if room code was passed in URL)
  const [joinRoomId, setJoinRoomId] = useState(initialRoomId);
  const [joinUsername, setJoinUsername] = useState("");

  // Error Messages
  const [errorMessage, setErrorMessage] = useState("");

  const generateRoomId = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!createUsername.trim()) {
      setErrorMessage("Please enter your name to create a room.");
      return;
    }

    const newRoomId = generateRoomId();
    onJoinRoom(newRoomId, createUsername.trim());
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!joinUsername.trim()) {
      setErrorMessage("Please enter your name to join.");
      return;
    }

    if (!joinRoomId.trim()) {
      setErrorMessage("Please enter a room code.");
      return;
    }

    onJoinRoom(joinRoomId.trim().toUpperCase(), joinUsername.trim());
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
        color: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "36px", maxWidth: "600px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <span style={{ fontSize: "2.5rem" }}>🍿</span>
          <h1 style={{ fontSize: "2.5rem", margin: 0, fontWeight: 800, letterSpacing: "-0.5px" }}>
            YouTube Watch Party
          </h1>
        </div>
        <p style={{ color: "#94a3b8", fontSize: "1.1rem", margin: "8px 0 0 0" }}>
          Watch YouTube videos in real-time sync with your friends, anywhere in the world!
        </p>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid #ef4444",
            color: "#fca5a5",
            padding: "10px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "0.9rem",
            maxWidth: "680px",
            width: "100%",
            textAlign: "center",
          }}
        >
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Cards Container */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
          width: "100%",
          maxWidth: "760px",
        }}
      >
        {/* Card 1: Create Watch Party */}
        <div
          style={{
            background: "#1e293b",
            padding: "28px",
            borderRadius: "16px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
            border: "1px solid #334155",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <span style={{ fontSize: "1.8rem" }}>👑</span>
            <h2 style={{ fontSize: "1.35rem", margin: "8px 0 4px 0", fontWeight: 700 }}>
              Create a Party
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "0.88rem", margin: 0 }}>
              Start a new room as the <strong>Host</strong>. Control playback, manage roles, and invite friends.
            </p>
          </div>

          <form onSubmit={handleCreateRoom} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "auto" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                Your Name
              </label>
              <input
                type="text"
                placeholder="e.g. Nilesh"
                value={createUsername}
                onChange={(e) => setCreateUsername(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #475569",
                  background: "#0f172a",
                  color: "#fff",
                  fontSize: "0.95rem",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                background: "#6366f1",
                color: "#fff",
                border: "none",
                padding: "12px",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "1rem",
                cursor: "pointer",
                transition: "background 0.2s",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
              }}
            >
              Create Room & Join as Host
            </button>
          </form>
        </div>

        {/* Card 2: Join Existing Watch Party */}
        <div
          style={{
            background: "#1e293b",
            padding: "28px",
            borderRadius: "16px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
            border: "1px solid #334155",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <span style={{ fontSize: "1.8rem" }}>🚀</span>
            <h2 style={{ fontSize: "1.35rem", margin: "8px 0 4px 0", fontWeight: 700 }}>
              Join a Party
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "0.88rem", margin: 0 }}>
              Enter an existing room code to watch together in real time.
            </p>
          </div>

          <form onSubmit={handleJoinRoom} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "auto" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                Room Code
              </label>
              <input
                type="text"
                placeholder="e.g. ABC123"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #475569",
                  background: "#0f172a",
                  color: "#fff",
                  fontSize: "0.95rem",
                  boxSizing: "border-box",
                  textTransform: "uppercase",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                Your Name
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul"
                value={joinUsername}
                onChange={(e) => setJoinUsername(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #475569",
                  background: "#0f172a",
                  color: "#fff",
                  fontSize: "0.95rem",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                background: "#059669",
                color: "#fff",
                border: "none",
                padding: "12px",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "1rem",
                cursor: "pointer",
                transition: "background 0.2s",
                boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)",
              }}
            >
              Join Watch Party
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Home;