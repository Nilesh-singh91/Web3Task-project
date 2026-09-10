// Participants.tsx
// Displays room participants with role badges and Host controls (promote, demote, kick).

import React from "react";
import { Participant, Role } from "../types";

interface ParticipantsProps {
  participants: Participant[];
  currentUserRole: Role;
  currentUserId: string;
  onAssignRole: (userId: string, role: "Moderator" | "Participant") => void;
  onRemoveParticipant: (userId: string) => void;
}

export const Participants: React.FC<ParticipantsProps> = ({
  participants,
  currentUserRole,
  currentUserId,
  onAssignRole,
  onRemoveParticipant,
}) => {
  const isCurrentUserHost = currentUserRole === "Host";

  const getRoleBadgeStyle = (role: Role) => {
    switch (role) {
      case "Host":
        return { background: "#dc2626", color: "#fff" }; // Red
      case "Moderator":
        return { background: "#2563eb", color: "#fff" }; // Blue
      case "Participant":
      default:
        return { background: "#4b5563", color: "#e5e7eb" }; // Gray
    }
  };

  return (
    <div style={{ background: "#1e1e24", padding: "16px 20px", borderRadius: "12px", color: "#f3f4f6" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid #374151", paddingBottom: "8px" }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>
          👥 Participants ({participants.length})
        </h3>
        {isCurrentUserHost && (
          <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontStyle: "italic" }}>
            Host Controls Active
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {participants.map((p) => {
          const isSelf = p.userId === currentUserId;
          const isTargetHost = p.role === "Host";

          return (
            <div
              key={p.userId}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                background: isSelf ? "#272730" : "#141418",
                borderRadius: "8px",
                border: isSelf ? "1px solid #4f46e5" : "1px solid #2d2d38",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              {/* Participant Name and Badge */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: 500, fontSize: "0.95rem" }}>
                  {p.username} {isSelf && <strong style={{ color: "#818cf8" }}>(You)</strong>}
                </span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontWeight: 700,
                    ...getRoleBadgeStyle(p.role),
                  }}
                >
                  {p.role}
                </span>
              </div>

              {/* Host Action Buttons (Only shown to Host, and not on the Host themselves) */}
              {isCurrentUserHost && !isTargetHost && (
                <div style={{ display: "flex", gap: "6px" }}>
                  {p.role === "Participant" ? (
                    <button
                      onClick={() => onAssignRole(p.userId, "Moderator")}
                      style={{
                        background: "#1d4ed8",
                        color: "#fff",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                      title="Promote to Moderator"
                    >
                      Make Moderator
                    </button>
                  ) : (
                    <button
                      onClick={() => onAssignRole(p.userId, "Participant")}
                      style={{
                        background: "#4b5563",
                        color: "#fff",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                      title="Demote to Participant"
                    >
                      Make Participant
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to remove ${p.username} from the room?`)) {
                        onRemoveParticipant(p.userId);
                      }
                    }}
                    style={{
                      background: "#991b1b",
                      color: "#fff",
                      border: "none",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                    title="Remove user from room"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Participants;
