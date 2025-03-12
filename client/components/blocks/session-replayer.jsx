"use client";

import { Pause } from "lucide-react";
import { Play } from "lucide-react";
import React, { useEffect, useRef, useState, useCallback } from "react";
import rrwebPlayer from "rrweb-player";
import "rrweb-player/dist/style.css";

const RichSessionPlayer = ({ events, aspectRatio = "16/9" }) => {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const timelineRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const formatTime = useCallback((ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  const handleTimelineClick = useCallback(
    (e) => {
      if (!playerRef.current || !timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      let clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const clickPosition = clickX / rect.width;
      const seekTime = totalTime * clickPosition;

      try {
        if (playerRef.current.goto) {
          playerRef.current.goto(seekTime);
        } else if (
          playerRef.current.replayer &&
          playerRef.current.replayer.goto
        ) {
          playerRef.current.replayer.goto(seekTime);
        }

        setCurrentTime(seekTime);
        setProgress(Math.max(0, Math.min(clickPosition * 100, 100)));
      } catch (e) {
        console.error("Error seeking:", e);
      }
    },
    [totalTime],
  );

  const togglePlayPause = useCallback(() => {
    if (!playerRef.current) return;

    try {
      if (playerRef.current.toggle) {
        playerRef.current.toggle();
        setIsPlaying(!isPlaying);
      } else if (isPlaying && playerRef.current.pause) {
        playerRef.current.pause();
        setIsPlaying(false);
      } else if (!isPlaying && playerRef.current.play) {
        playerRef.current.play();
        setIsPlaying(true);
      } else if (playerRef.current.replayer) {
        if (isPlaying) {
          playerRef.current.replayer.pause &&
            playerRef.current.replayer.pause();
          setIsPlaying(false);
        } else {
          playerRef.current.replayer.play && playerRef.current.replayer.play();
          setIsPlaying(true);
        }
      }
    } catch (e) {
      console.error("Error toggling play state:", e);
    }
  }, [isPlaying]);

  const handleMouseDown = useCallback(
    (e) => {
      setIsDragging(true);
      handleTimelineClick(e);
    },
    [handleTimelineClick],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (isDragging) {
        handleTimelineClick(e);
      }
    },
    [isDragging, handleTimelineClick],
  );

  useEffect(() => {
    if (playerRef.current) {
      try {
        if (typeof playerRef.current.destroy === "function") {
          playerRef.current.destroy();
        }
        playerRef.current = null;
      } catch (e) {
        console.error("Error cleaning up previous player:", e);
      }
    }

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    if (!events || !events.length || !containerRef.current) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (events.length > 1) {
        const startTime = events[0].timestamp;
        const endTime = events[events.length - 1].timestamp;
        setTotalTime(endTime - startTime);
      }

      setTimeout(() => {
        try {
          containerRef.current.innerHTML = "";

          const player = new rrwebPlayer({
            target: containerRef.current,
            props: {
              events: events,
              width: containerRef.current.clientWidth,
              height: containerRef.current.clientHeight,
              autoPlay: true,
              skipInactive: true,
              showController: false,
              speedOption: [1],
              css: {
                "background-color": "transparent",
                "border-radius": "0.5rem",
              },
            },
          });

          playerRef.current = player;
          setIsPlaying(true);
          setIsLoading(false);

          progressIntervalRef.current = setInterval(() => {
            try {
              if (player.getCurrentTime) {
                const time = player.getCurrentTime();
                setCurrentTime(time);
                if (totalTime > 0) {
                  setProgress((time / totalTime) * 100);
                }
              } else if (
                player.iframe &&
                player.iframe.contentWindow &&
                player.iframe.contentWindow.replayer
              ) {
                const replayer = player.iframe.contentWindow.replayer;
                if (replayer.getCurrentTime) {
                  const time = replayer.getCurrentTime();
                  setCurrentTime(time);
                  if (totalTime > 0) {
                    setProgress((time / totalTime) * 100);
                  }
                }
              } else if (player.replayer) {
                const time = player.replayer.getCurrentTime
                  ? player.replayer.getCurrentTime()
                  : player.replayer.timer
                    ? player.replayer.timer.elapsedTime
                    : 0;

                setCurrentTime(time);
                if (totalTime > 0) {
                  setProgress((time / totalTime) * 100);
                }
              }
            } catch (e) {
              console.warn("Error updating progress:", e);
            }
          }, 100);
        } catch (error) {
          console.error("Error initializing player:", error);
          setError("Failed to initialize the session replay player.");
          setIsLoading(false);
        }
      }, 100);
    } catch (error) {
      console.error("Error in setting up player:", error);
      setError("Failed to set up the session replay player.");
      setIsLoading(false);
    }

    return () => {
      if (playerRef.current) {
        try {
          if (typeof playerRef.current.destroy === "function") {
            playerRef.current.destroy();
          }
          playerRef.current = null;
        } catch (e) {
          console.error("Error during cleanup:", e);
        }
      }

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [events, totalTime]);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseUp, handleMouseMove]);

  return (
    <div className="rich-session-player w-full">
      <div
        className="relative overflow-hidden rounded-lg"
        style={{
          width: "100%",
          aspectRatio: aspectRatio,
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-600">Loading session replay...</p>
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          className="w-full h-full"
          style={{ visibility: isLoading ? "hidden" : "visible" }}
        />

        {(!events || events.length === 0) && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500">
              No session recording data available.
            </p>
          </div>
        )}
      </div>
      {!isLoading && events && events.length > 0 && (
        <div className="rounded-lg mt-6 flex items-center space-x-4">
          <button
            className="flex-shrink-0 focus:outline-none"
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 fill-current" />
            )}
          </button>
          <div
            className="flex-grow relative h-2 bg-gray-300 rounded-full cursor-pointer"
            ref={timelineRef}
            onClick={handleTimelineClick}
            onMouseDown={handleMouseDown}
          >
            <div
              className="absolute top-0 left-0 h-full bg-black rounded-full"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 h-4 w-4 bg-white border-2 border-black rounded-full shadow cursor-pointer"
              style={{
                left: `${Math.max(0, Math.min(progress, 100))}%`,
                transform: "translateX(-50%) translateY(-50%)",
                zIndex: 10,
              }}
            />
          </div>
          <div className="flex-shrink-0 text-sm text-gray-600">
            {formatTime(currentTime)} / {formatTime(totalTime)}
          </div>
        </div>
      )}
    </div>
  );
};

export default RichSessionPlayer;
