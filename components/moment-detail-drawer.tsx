"use client";

import type { MomentWithAuthor } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import Link from "next/link";
import { getImageUrl, getOriginalImageUrl } from "@/lib/image-utils";
import { Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { SongPlayer } from "@/components/song-player";

type Props = {
  moment: MomentWithAuthor | null;
  currentUserId: string;
  isOwn: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MomentDetailDrawer({
  moment,
  currentUserId,
  isOwn,
  onOpenChange,
}: Props) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    if (moment?.image_path) {
      setImgSrc(getOriginalImageUrl(moment.image_path));
    } else {
      setImgSrc(null);
    }
  }, [moment?.image_path]);

  useEffect(() => {
    if (!moment) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [moment, onOpenChange]);

  if (!moment) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xl bg-black/60"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="relative flex h-full w-full max-w-lg flex-col items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <div className="mb-3 flex items-center gap-2 text-white">
          <span className="text-2xl">{moment.profiles.emoji}</span>
          <span className="text-lg font-semibold">{moment.title}</span>
        </div>

        {/* Image */}
        {moment.image_path && imgSrc && (
          <div className="relative w-full overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt={moment.title}
              className="h-auto max-h-[70vh] w-full rounded-xl object-contain"
              onError={() => setImgSrc(getImageUrl(moment.image_path!))}
            />
          </div>
        )}

        {/* Text */}
        {moment.text && (
          <p className="mt-3 max-w-md whitespace-pre-wrap text-center text-sm text-white/90">
            {moment.text}
          </p>
        )}

        {/* Song */}
        {moment.song_title && (
          <div className="mt-3 w-full max-w-md">
            <SongPlayer
              title={moment.song_title}
              artist={moment.song_artist ?? ""}
              deezerId={moment.song_deezer_id}
              coverUrl={moment.song_cover_url}
              spotifyUrl={moment.song_spotify_url}
              variant="detail"
            />
          </div>
        )}

        {/* Date */}
        <p className="mt-2 text-xs text-white/60">
          {format(new Date(moment.moment_date + "T00:00:00"), "PPP", {
            locale: de,
          })}
          {moment.moment_time ? `, ${moment.moment_time} Uhr` : ""}
        </p>

        {/* Edit button – fixed at bottom */}
        {isOwn && (
          <div className="absolute bottom-6 left-4 right-4 flex justify-center">
            <Link
              href={`/edit/${moment.id}`}
              onClick={() => onOpenChange(false)}
              className={cn(buttonVariants(), "h-12 w-full max-w-md")}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Bearbeiten
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
