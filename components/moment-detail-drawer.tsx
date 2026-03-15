"use client";

import type { MomentWithAuthor } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import { getImageUrl } from "@/lib/image-utils";
import { Pencil, Download, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

type Props = {
  moment: MomentWithAuthor | null;
  isOwn: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MomentDetailDrawer({ moment, isOwn, onOpenChange }: Props) {
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
          className="absolute top-4 right-4 z-10 rounded-full bg-black/40 p-2 text-white transition-colors hover:bg-black/60"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <div className="mb-3 flex items-center gap-2 text-white">
          <span className="text-2xl">{moment.profiles.emoji}</span>
          <span className="text-lg font-semibold">{moment.title}</span>
        </div>

        {/* Image */}
        {moment.image_path && (
          <div className="relative w-full overflow-hidden rounded-xl">
            <Image
              src={getImageUrl(moment.image_path)}
              alt={moment.title}
              width={1600}
              height={1200}
              className="h-auto max-h-[70vh] w-full rounded-xl object-contain"
              sizes="(max-width: 512px) 92vw, 480px"
            />
            <a
              href={getImageUrl(moment.image_path)}
              download
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "secondary", size: "icon" }),
                "absolute right-2 bottom-2 h-9 w-9 rounded-full shadow-md",
              )}
            >
              <Download className="h-4 w-4" />
            </a>
          </div>
        )}

        {/* Text */}
        {moment.text && (
          <p className="mt-3 max-w-md whitespace-pre-wrap text-center text-sm text-white/90">
            {moment.text}
          </p>
        )}

        {/* Date */}
        <p className="mt-2 text-xs text-white/60">
          {format(new Date(moment.moment_date + "T00:00:00"), "PPP", {
            locale: de,
          })}
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
