// Controls.tsx
// Playback and video change controls with role-based accessibility.
// Host & Moderator have full control; Participants have view-only mode.

import React, { useState } from "react";
import { Role } from "../types";

interface ControlsProps {
  role: Role;
  playState: "playing" | "paused";
  currentTime: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onChangeVideo: (videoId: string) => void;
}

// Helper to extract clean 11-character YouTube video ID from various URL formats
export function extractYouTubeId(urlOrId: string): string | null {
  const trimmed = urlOrId.trim();
  if (!trimmed) return null;

  // If already an 11-character ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle standard youtube.com/watch?v=ID format
  const watchMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (watchMatch && watchMatch[1]) {
    return watchMatch[1];
  }

  return null;
}

export const Controls: React.FC<ControlsProps> = ({
  role,
  playState,
  currentTime,
  onPlay,
  onPause,
  onSeek,
  onChangeVideo,
}) => {
  const [videoInput, setVideoInput] = useState("");
  const [inputError, setInputError] = useState("");

  const canControl = role === "Host" || role === "Moderator";

  const handleVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInputError("");

    if (!canControl) {
      setInputError("Only Host and Moderator can change the video.");
      return;
    }

    const extractedId = extractYouTubeId(videoInput);
    if (!extractedId) {
      setInputError("Invalid YouTube URL or Video ID. Example: aqz-KE-bpKQ or https://youtu.be/...");
      return;
    }

    onChangeVideo(extractedId);
    setVideoInput("");
  };

  const handleQuickSeek = (secondsOffset: number) => {
    if (!canControl) return;
    const newTime = Math.max(0, currentTime + secondsOffset);
    onSeek(newTime);
  };

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div style={{ background: "#1e1e24", padding: "16px 20px", borderRadius: "12px", marginTop: "16px", color: "#f3f4f6" }}>
      {/* 1. Playback Status & Role Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <span style={{ fontSize: "0.85rem", color: "#9ca3af", marginRight: "6px" }}>Status:</span>
          <span style={{ fontWeight: 600, color: playState === "playing" ? "#10b981" : "#f59e0b" }}>
            {playState === "playing" ? "▶ Playing" : "⏸ Paused"}
          </span>
          <span style={{ marginLeft: "10px", fontSize: "0.85rem", color: "#9ca3af" }}>
            Time: {formatTime(currentTime)}
          </span>
        </div>

        <div>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "0.75rem",
              fontWeight: 700,
              background: role === "Host" ? "#ef4444" : role === "Moderator" ? "#3b82f6" : "#4b5563",
              color: "#ffffff",
              letterSpacing: "0.5px",
            }}
          >
            {role.toUpperCase()}
          </span>
        </div>
      </div>

      {/* 2. Controls Section */}
      {canControl ? (
        <div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
            {playState === "playing" ? (
              <button
                onClick={onPause}
                style={{
                  background: "#eab308",
                  color: "#000",
                  border: "none",
                  padding: "8px 18px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                }}
              >
                ⏸ Pause
              </button>
            ) : (
              <button
                onClick={onPlay}
                style={{
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  padding: "8px 20px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                }}
              >
                ▶ Play
              </button>
            )}

            <button
              onClick={() => handleQuickSeek(-10)}
              style={{
                background: "#374151",
                color: "#fff",
                border: "none",
                padding: "8px 14px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "0.85rem",
              }}
              title="Rewind 10 seconds"
            >
              ⏪ -10s
            </button>

            <button
              onClick={() => handleQuickSeek(10)}
              style={{
                background: "#374151",
                color: "#fff",
                border: "none",
                padding: "8px 14px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "0.85rem",
              }}
              title="Fast Forward 10 seconds"
            >
              +10s ⏩
            </button>
          </div>

          {/* Change Video Form */}
          <form onSubmit={handleVideoSubmit} style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Paste YouTube Video URL or ID (e.g. aqz-KE-bpKQ)..."
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              style={{
                flex: "1 1 240px",
                padding: "8px 12px",
                background: "#111827",
                border: "1px solid #374151",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "0.85rem",
              }}
            />
            <button
              type="submit"
              style={{
                background: "#2563eb",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.85rem",
              }}
            >
              Change Video
            </button>
          </form>

          {inputError && (
            <p style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "6px", marginBottom: 0 }}>
              ⚠️ {inputError}
            </p>
          )}
        </div>
      ) : (
        <div style={{ background: "#111827", padding: "12px", borderRadius: "8px", border: "1px dashed #374151" }}>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#9ca3af" }}>
            🔒 <strong>Participant View Only:</strong> Playback is synchronized automatically by the Host and Moderators. Controls are view-only for Participants.
          </p>
        </div>
      )}
    </div>
  );
};

export default Controls;
