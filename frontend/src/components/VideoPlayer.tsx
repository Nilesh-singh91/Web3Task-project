// VideoPlayer.tsx
// Embedded YouTube Player using official YouTube IFrame Player API.
// Features loop-prevention, cross-origin communication, and autoplay handling.

import React, { useEffect, useRef, useState } from "react";

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
  onLocalPlay?: (time: number) => void;
  onLocalPause?: (time: number) => void;
  onLocalSeek?: (time: number) => void;
  onTimeUpdate?: (time: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  playState,
  currentTime,
  canControl,
  onLocalPlay,
  onLocalPause,
  onLocalSeek,
  onTimeUpdate,
}) => {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);

  // CRITICAL FLAG: Prevents ping-pong loop between server and YouTube player events
  const isRemoteActionRef = useRef<boolean>(false);
  const currentVideoIdRef = useRef<string>(videoId);
  const playStateRef = useRef<"playing" | "paused">(playState);
  playStateRef.current = playState;

  // 1. Initialize YouTube IFrame API script & player
  useEffect(() => {
    let checkInterval: any = null;

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      if (playerRef.current) return;

      playerRef.current = new window.YT.Player("youtube-player-element", {
        height: "100%",
        width: "100%",
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: canControl ? 1 : 0,
          disablekb: canControl ? 0 : 1,
          modestbranding: 1,
          rel: 0,
          enablejsapi: 1,
          origin: window.location.origin,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            setIsReady(true);
            if (currentTime > 0) {
              playerRef.current.seekTo(currentTime, true);
            }
            if (playStateRef.current === "playing") {
              try {
                playerRef.current.playVideo();
              } catch (err) {
                setNeedsUserInteraction(true);
              }
            }
          },
          onStateChange: (event: any) => {
            // If triggered by remote server action, ignore and reset flag once settled
            if (isRemoteActionRef.current) {
              if (
                (playStateRef.current === "playing" && event.data === 1) ||
                (playStateRef.current === "paused" && event.data === 2)
              ) {
                setTimeout(() => {
                  isRemoteActionRef.current = false;
                }, 300);
              }
              return;
            }

            // Only users with control permissions can send events from direct player interaction
            if (!canControl) return;

            const time = playerRef.current?.getCurrentTime
              ? Math.floor(playerRef.current.getCurrentTime())
              : 0;

            if (event.data === 1 && onLocalPlay) {
              onLocalPlay(time);
            } else if (event.data === 2 && onLocalPause) {
              onLocalPause(time);
            }
          },
          onError: (e: any) => {
            console.warn("YouTube Player error:", e.data);
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          initPlayer();
        }
      }, 100);
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  // 2. Periodic time ticker to keep currentTime synced while playing
  useEffect(() => {
    if (!isReady) return;

    const ticker = setInterval(() => {
      try {
        if (
          playerRef.current &&
          typeof playerRef.current.getCurrentTime === "function"
        ) {
          const time = Math.floor(playerRef.current.getCurrentTime());
          if (onTimeUpdate) {
            onTimeUpdate(time);
          }
        }
      } catch (e) {}
    }, 1000);

    return () => clearInterval(ticker);
  }, [isReady, onTimeUpdate]);

  // 3. Handle remote video change
  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    if (currentVideoIdRef.current !== videoId) {
      currentVideoIdRef.current = videoId;
      isRemoteActionRef.current = true;

      try {
        if (playState === "playing") {
          playerRef.current.loadVideoById(videoId, currentTime || 0);
        } else {
          playerRef.current.cueVideoById(videoId, currentTime || 0);
        }
      } catch (e) {
        console.warn("Failed to load/cue video:", e);
      }
    }
  }, [videoId, isReady, playState, currentTime]);

  // 4. Handle remote play/pause state change
  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    try {
      const state = playerRef.current.getPlayerState
        ? playerRef.current.getPlayerState()
        : -1;

      if (playState === "playing" && state !== 1) {
        isRemoteActionRef.current = true;
        const playPromise = playerRef.current.playVideo();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {
            setNeedsUserInteraction(true);
          });
        }
      } else if (playState === "paused" && state !== 2 && state !== 5) {
        isRemoteActionRef.current = true;
        playerRef.current.pauseVideo();
      }
    } catch (e) {
      console.warn("Error applying remote play/pause state:", e);
    }
  }, [playState, isReady]);

  // 5. Handle remote seek change
  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    try {
      const current = playerRef.current.getCurrentTime
        ? playerRef.current.getCurrentTime()
        : 0;
      if (Math.abs(current - currentTime) > 2) {
        isRemoteActionRef.current = true;
        playerRef.current.seekTo(currentTime, true);
      }
    } catch (e) {
      console.warn("Error applying remote seek:", e);
    }
  }, [currentTime, isReady]);

  // Handler for user interaction overlay to satisfy browser autoplay policy
  const handleUserGesture = () => {
    setNeedsUserInteraction(false);
    if (playerRef.current) {
      try {
        playerRef.current.unMute();
        if (playState === "playing") {
          playerRef.current.playVideo();
        }
      } catch (e) {}
    }
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        paddingTop: "56.25%",
        background: "#000",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
      }}
      onClick={needsUserInteraction ? handleUserGesture : undefined}
    >
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

      {/* Autoplay unlock prompt if browser blocks unmuted playback */}
      {needsUserInteraction && (
        <div
          onClick={handleUserGesture}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            zIndex: 10,
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🔊</span>
          <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>
            Click anywhere to sync video & audio with the Host!
          </p>
          <span style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "4px" }}>
            (Browser requires a single user click to allow playback)
          </span>
        </div>
      )}

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