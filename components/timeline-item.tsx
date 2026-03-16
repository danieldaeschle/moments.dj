"use client";

import type { MomentWithAuthor } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { motion } from "framer-motion";
import Image from "next/image";
import { getImageUrl } from "@/lib/image-utils";
import { Heart, Loader2 } from "lucide-react";
import { toggleLike } from "@/app/(app)/actions";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { SongPlayer } from "@/components/song-player";

type Props = {
  moment: MomentWithAuthor;
  currentUserId: string;
  onSelect: () => void;
};

export function TimelineItem({ moment, currentUserId, onSelect }: Props) {
  const isLikedByMe = moment.moment_likes?.some(
    (l) => l.user_id === currentUserId,
  );
  const isKeyMoment = (moment.moment_likes?.length ?? 0) >= 2;

  return (
    <div className="relative flex items-start">
      {/* Left emoji marker */}
      <div
        data-emoji-marker
        className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center text-3xl"
      >
        {moment.profiles.emoji}
      </div>

      {/* Right side – full width */}
      <div className="min-w-0 flex-1 pl-3">
        <ItemCard
          moment={moment}
          isLikedByMe={isLikedByMe}
          isKeyMoment={isKeyMoment}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}

function ItemCard({
  moment,
  isLikedByMe,
  isKeyMoment,
  onSelect,
}: {
  moment: MomentWithAuthor;
  isLikedByMe: boolean;
  isKeyMoment: boolean;
  onSelect: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      await toggleLike(moment.id);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <motion.div
        className={cn(
          "rounded-xl cursor-pointer",
          isKeyMoment &&
            "p-0.5 bg-linear-to-br from-pink-500 via-purple-500 to-indigo-500",
        )}
        whileTap={{ scale: 0.98 }}
        onClick={onSelect}
      >
        <Card
          className={cn(
            "py-0 gap-1 transition-shadow hover:shadow-md",
            isKeyMoment && "rounded-[16px]",
          )}
        >
          {moment.image_path && (
            <div
              className={cn(
                "overflow-hidden",
                isKeyMoment ? "rounded-t-[16px]" : "rounded-t-lg",
              )}
            >
              <Image
                src={getImageUrl(moment.image_path)}
                alt={moment.title}
                width={800}
                height={600}
                loading="eager"
                className="h-auto w-full"
                sizes="(max-width: 512px) 80vw, 420px"
              />
            </div>
          )}
          <CardContent className="py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="mb-2 text-xs text-muted-foreground/70">
                  {format(
                    new Date(moment.moment_date + "T00:00:00"),
                    "d. MMM yyyy",
                    {
                      locale: de,
                    },
                  )}
                  {moment.moment_time ? `, ${moment.moment_time} Uhr` : ""}
                </p>
                <h3 className="text-sm font-medium leading-snug">
                  {moment.title}
                </h3>
                {moment.text && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {moment.text}
                  </p>
                )}
              </div>
              <button
                onClick={handleLike}
                disabled={isPending}
                className="shrink-0 p-2 -mr-3 -mt-2 rounded-full transition-colors hover:bg-muted"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/50" />
                ) : (
                  <Heart
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isLikedByMe
                        ? "fill-red-500 text-red-500"
                        : "text-muted-foreground/50",
                    )}
                  />
                )}
              </button>
            </div>
            {moment.song_title && (
              <SongPlayer
                title={moment.song_title}
                artist={moment.song_artist ?? ""}
                deezerId={moment.song_deezer_id}
                coverUrl={moment.song_cover_url}
                spotifyUrl={moment.song_spotify_url}
              />
            )}
            {isKeyMoment && (
              <p className="mt-2 text-[10px] font-medium tracking-wide uppercase text-transparent bg-clip-text bg-linear-to-r from-pink-500 via-purple-500 to-indigo-500">
                ✨ Schlüsselmoment
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
