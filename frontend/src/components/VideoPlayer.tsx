// VideoPlayer.tsx
// Embedded YouTube Player using the official YouTube IFrame Player API.
// Includes loop-prevention logic so remote server updates do not trigger duplicate emits.

import React, { useEffect, useRef, useState } from "react";

// Extend Window interface for YouTube IFrame API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface VideoPlayerProps {
  videoId: string;
  playState: "playing" | "paused";
  currentTime: number;
  canControl: boolean;
  onLocalPlay?: () => void;
  onLocalPause?: () => void;
  onLocalSeek?: (time: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  playState,
  currentTime,
  canControl,
  onLocalPlay,
  onLocalPause,
  onLocalSeek,
}) => {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  // CRITICAL FLAG: Prevents infinite loop between server and YouTube player events
  const isRemoteActionRef = useRef<boolean>(false);
  const currentVideoIdRef = useRef<string>(videoId);

  // 1. Initialize YouTube IFrame Player API script
  useEffect(() => {
    // If YouTube API script is not yet added to <head>, inject it
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      playerRef.current = new window.YT.Player("youtube-player-element", {
        height: "100%",
        width: "100%",
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: canControl ? 1 : 0, // Disable native player controls if user is Participant
          disablekb: canControl ? 0 : 1, // Disable keyboard controls if user cannot control
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            setIsReady(true);
            if (currentTime > 0) {
              playerRef.current.seekTo(currentTime, true);
            }
            if (playState === "playing") {
              playerRef.current.playVideo();
            }
          },
          onStateChange: (event: any) => {
            // If this event was caused by a remote server broadcast, skip sending it back!
            if (isRemoteActionRef.current) {
              isRemoteActionRef.current = false;
              return;
            }

            // Only users with control permissions can send events to server from native player
            if (!canControl) return;

            // YouTube states: 1 = Playing, 2 = Paused
            if (event.data === 1 && onLocalPlay) {
              onLocalPlay();
            } else if (event.data === 2 && onLocalPause) {
              onLocalPause();
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, []);

  // 2. Handle remote video change
  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    if (currentVideoIdRef.current !== videoId) {
      currentVideoIdRef.current = videoId;
      isRemoteActionRef.current = true;
      if (typeof playerRef.current.loadVideoById === "function") {
        playerRef.current.loadVideoById(videoId, 0);
      }
    }
  }, [videoId, isReady]);

  // 3. Handle remote play/pause state change
  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    try {
      const state = playerRef.current.getPlayerState ? playerRef.current.getPlayerState() : -1;

      if (playState === "playing" && state !== 1) {
        isRemoteActionRef.current = true;
        playerRef.current.playVideo();
      } else if (playState === "paused" && state !== 2) {
        isRemoteActionRef.current = true;
        playerRef.current.pauseVideo();
      }
    } catch (e) {
      console.warn("Error applying remote play/pause state:", e);
    }
  }, [playState, isReady]);

  // 4. Handle remote seek change
  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    try {
      const current = playerRef.current.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
      // Seek only if difference is greater than 1.5 seconds to avoid jitter
      if (Math.abs(current - currentTime) > 1.5) {
        isRemoteActionRef.current = true;
        playerRef.current.seekTo(currentTime, true);
      }
    } catch (e) {
      console.warn("Error applying remote seek:", e);
    }
  }, [currentTime, isReady]);

  return (
    <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", background: "#000", borderRadius: "12px", overflow: "hidden", boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}>
      <div
        id="youtube-player-element"
        ref={playerContainerRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />
      {!isReady && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            background: "rgba(0,0,0,0.8)",
            fontSize: "1rem",
            fontWeight: 500,
          }}
        >
          Loading YouTube Player...
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
