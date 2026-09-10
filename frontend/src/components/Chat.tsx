// Chat.tsx
// Real-time Room Chat component using Socket.IO

import React, { useState, useEffect, useRef } from "react";
import { ChatMessage } from "../types";

interface ChatProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
}

export const Chat: React.FC<ChatProps> = ({
  messages,
  currentUserId,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom whenever a new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText);
    setInputText("");
  };

  return (
    <div
      style={{
        background: "#1e1e24",
        borderRadius: "12px",
        padding: "16px",
        color: "#f3f4f6",
        display: "flex",
        flexDirection: "column",
        height: "360px",
        border: "1px solid #2d2d38",
      }}
    >
      {/* Chat Header */}
      <div
        style={{
          borderBottom: "1px solid #374151",
          paddingBottom: "8px",
          marginBottom: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600 }}>
          💬 Room Chat
        </h3>
        <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
          {messages.length} {messages.length === 1 ? "message" : "messages"}
        </span>
      </div>

      {/* Messages List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          paddingRight: "4px",
          marginBottom: "12px",
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              margin: "auto",
              textAlign: "center",
              color: "#6b7280",
              fontSize: "0.85rem",
            }}
          >
            No messages yet. Say hi! 👋
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === currentUserId;
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "2px",
                    fontSize: "0.75rem",
                    color: isMe ? "#a5b4fc" : "#9ca3af",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    {msg.userName} {isMe && "(You)"}
                  </span>
                  <span style={{ fontSize: "0.68rem", opacity: 0.7 }}>
                    {msg.timestamp}
                  </span>
                </div>
                <div
                  style={{
                    background: isMe ? "#4338ca" : "#2d2d38",
                    color: "#ffffff",
                    padding: "8px 12px",
                    borderRadius: isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                    fontSize: "0.88rem",
                    wordBreak: "break-word",
                    lineHeight: 1.35,
                  }}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field & Send Button */}
      <form
        onSubmit={handleSend}
        style={{
          display: "flex",
          gap: "8px",
        }}
      >
        <input
          type="text"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          maxLength={500}
          style={{
            flex: 1,
            padding: "8px 12px",
            background: "#111827",
            border: "1px solid #374151",
            borderRadius: "6px",
            color: "#fff",
            fontSize: "0.85rem",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          style={{
            background: inputText.trim() ? "#4f46e5" : "#374151",
            color: "#ffffff",
            border: "none",
            padding: "8px 14px",
            borderRadius: "6px",
            cursor: inputText.trim() ? "pointer" : "not-allowed",
            fontWeight: 600,
            fontSize: "0.85rem",
            transition: "background 0.2s",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;