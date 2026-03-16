"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Music, Search, X, Play, Pause, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Song } from "@/lib/types";

type Props = {
  value: Song | null;
  onChange: (song: Song | null) => void;
};

export function SongSearch({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setPlayingId(null);
  }, []);

  useEffect(() => {
    return () => {
      stopAudio();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [stopAudio]);

  function handleSearch(q: string) {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!q.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/songs/search?q=${encodeURIComponent(q.trim())}`,
        );
        if (res.ok) {
          setResults(await res.json());
        }
      } finally {
        setLoading(false);
      }
    }, 350);
  }

  function togglePreview(deezerId: string) {
    if (playingId === deezerId) {
      stopAudio();
      return;
    }

    stopAudio();
    const audio = new Audio(
      `/api/songs/preview?id=${encodeURIComponent(deezerId)}`,
    );
    audioRef.current = audio;
    setPlayingId(deezerId);
    audio.play();
    audio.addEventListener("ended", () => setPlayingId(null));
  }

  function selectSong(song: Song) {
    stopAudio();
    onChange(song);
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  function removeSong() {
    stopAudio();
    onChange(null);
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-lg border p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value.coverUrl}
          alt={value.title}
          className="h-10 w-10 rounded"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{value.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {value.artist}
          </p>
        </div>
        <button
          type="button"
          onClick={removeSong}
          className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 text-muted-foreground transition-colors hover:border-muted-foreground/50"
      >
        <Music className="h-5 w-5" />
        <span className="text-sm">Song hinzufügen</span>
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          placeholder="Song suchen..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="h-12 pl-9 pr-9 text-base"
        />
        <button
          type="button"
          onClick={() => {
            stopAudio();
            setOpen(false);
            setQuery("");
            setResults([]);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="max-h-64 overflow-y-auto rounded-lg border">
          {results.map((song, i) => (
            <button
              key={`${song.title}-${song.artist}-${i}`}
              type="button"
              onClick={() => selectSong(song)}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted",
                i !== 0 && "border-t",
              )}
            >
              <div className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={song.coverUrl}
                  alt={song.title}
                  className="h-10 w-10 rounded"
                />
                {song.deezerId && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePreview(song.deezerId);
                    }}
                    className="absolute inset-0 flex items-center justify-center rounded bg-black/40 opacity-0 transition-opacity hover:opacity-100"
                  >
                    {playingId === song.deezerId ? (
                      <Pause className="h-4 w-4 text-white" />
                    ) : (
                      <Play className="h-4 w-4 text-white" />
                    )}
                  </button>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{song.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {song.artist}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && query.trim() && results.length === 0 && (
        <p className="py-3 text-center text-sm text-muted-foreground">
          Keine Songs gefunden
        </p>
      )}
    </div>
  );
}
