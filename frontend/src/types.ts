// types.ts
// Common TypeScript interfaces and types for YouTube Watch Party

export type Role = "Host" | "Moderator" | "Participant";

export interface Participant {
  userId: string;
  username: string;
  role: Role;
  socketId?: string;
}

export interface RoomState {
  roomId: string;
  videoId: string;
  playState: "playing" | "paused";
  currentTime: number;
  participants: Participant[];
  myUserId: string;
  myRole: Role;
}

export interface SyncStatePayload {
  roomId: string;
  videoId: string;
  playState: "playing" | "paused";
  currentTime: number;
  myUserId: string;
  myRole: Role;
  participants: Participant[];
}

export interface PlaybackPayload {
  currentTime?: number;
  time?: number;
}

export interface ChangeVideoPayload {
  videoId: string;
  playState: "playing" | "paused";
  currentTime: number;
}

export interface RoleAssignedPayload {
  userId: string;
  username: string;
  role: Role;
  participants: Participant[];
}

export interface ParticipantRemovedPayload {
  userId: string;
  participants: Participant[];
}

export interface ErrorMessagePayload {
  message: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
  roomId: string;
}