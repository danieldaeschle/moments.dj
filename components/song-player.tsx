"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PREVIEW_DURATION = 30; // Deezer previews are always ~30s

type Props = {
  title: string;
  artist: string;
  deezerId: string | null;
  coverUrl: string | null;
  spotifyUrl: string | null;
  variant?: "card" | "detail";
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function SongPlayer({
  title,
  artist,
  deezerId,
  coverUrl,
  spotifyUrl,
  variant = "card",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number>(0);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    cancelAnimationFrame(rafRef.current);
    setLoading(false);
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  }, []);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  function togglePlay(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!deezerId) return;

    if (playing || loading) {
      stop();
      return;
    }

    const audio = new Audio(
      `/api/songs/preview?id=${encodeURIComponent(deezerId)}`,
    );
    audioRef.current = audio;
    setLoading(true);

    audio.addEventListener("playing", () => {
      setLoading(false);
      setPlaying(true);

      function tick() {
        const dur =
          audio.duration && isFinite(audio.duration)
            ? audio.duration
            : PREVIEW_DURATION;
        setProgress(audio.currentTime / dur);
        setCurrentTime(audio.currentTime);
        rafRef.current = requestAnimationFrame(tick);
      }
      rafRef.current = requestAnimationFrame(tick);
    });

    audio.play().catch(() => {
      setLoading(false);
    });

    audio.addEventListener("ended", () => {
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      cancelAnimationFrame(rafRef.current);
    });
  }

  function handleSpotifyClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (effectiveSpotifyUrl) {
      window.open(effectiveSpotifyUrl, "_blank", "noopener,noreferrer");
    }
  }

  const isDetail = variant === "detail";

  // Always generate a Spotify search URL as fallback
  const effectiveSpotifyUrl =
    spotifyUrl ||
    `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`)}`;

  return (
    <div
      className={cn(
        "rounded-lg",
        isDetail
          ? "bg-white/10 p-3"
          : "border border-border/50 bg-muted/30 px-2.5 py-2 mt-2",
      )}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2.5">
        {/* Cover + play button */}
        {deezerId ? (
          <button
            onClick={togglePlay}
            className="relative shrink-0 h-9 w-9 rounded overflow-hidden"
          >
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
              ) : playing ? (
                <Pause className="h-3.5 w-3.5 text-white" />
              ) : (
                <Play className="h-3.5 w-3.5 text-white" />
              )}
            </div>
          </button>
        ) : coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={title}
            className="h-9 w-9 shrink-0 rounded object-cover"
          />
        ) : null}

        {/* Song info + progress */}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-xs font-medium",
              isDetail && "text-white",
            )}
          >
            {title}
          </p>
          {playing || loading ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              {loading ? (
                <div
                  className={cn(
                    "relative flex-1 h-1 rounded-full overflow-hidden",
                    isDetail ? "bg-white/20" : "bg-foreground/10",
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-y-0 w-1/4 rounded-full animate-[shimmer_1.2s_ease-in-out_infinite]",
                      isDetail ? "bg-white/40" : "bg-foreground/20",
                    )}
                    style={{
                      animation: "shimmer 1.2s ease-in-out infinite",
                    }}
                  />
                </div>
              ) : (
                <>
                  <div
                    className={cn(
                      "relative flex-1 h-1 rounded-full overflow-hidden",
                      isDetail ? "bg-white/20" : "bg-foreground/10",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-full",
                        isDetail ? "bg-white/60" : "bg-foreground/40",
                      )}
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] tabular-nums shrink-0",
                      isDetail ? "text-white/50" : "text-muted-foreground",
                    )}
                  >
                    {formatTime(currentTime)}
                  </span>
                </>
              )}
            </div>
          ) : (
            <p
              className={cn(
                "truncate text-[10px]",
                isDetail ? "text-white/60" : "text-muted-foreground",
              )}
            >
              {artist}
            </p>
          )}
        </div>

        {/* Spotify link */}
        {effectiveSpotifyUrl && (
          <button
            onClick={handleSpotifyClick}
            className={cn(
              "shrink-0 rounded-full p-1.5 transition-colors",
              isDetail ? "hover:bg-white/10" : "hover:bg-muted",
            )}
            title="In Spotify öffnen"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#1DB954]">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
