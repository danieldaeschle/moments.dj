"use client";

import type { MomentWithAuthor } from "@/lib/types";
import { TimelineItem } from "@/components/timeline-item";
import { FAB } from "@/components/fab";
import { MomentDetailDrawer } from "@/components/moment-detail-drawer";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import { useState, useRef, useEffect, useCallback } from "react";

type Props = {
  moments: MomentWithAuthor[];
  currentUserId: string;
};

export function Timeline({ moments, currentUserId }: Props) {
  const [selectedMoment, setSelectedMoment] = useState<MomentWithAuthor | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [lineStyle, setLineStyle] = useState<{
    top: number;
    height: number;
  } | null>(null);

  const measureLine = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const emojis = container.querySelectorAll<HTMLElement>(
      "[data-emoji-marker]",
    );
    if (emojis.length < 2) {
      setLineStyle(null);
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const firstRect = emojis[0].getBoundingClientRect();
    const lastRect = emojis[emojis.length - 1].getBoundingClientRect();
    const top = firstRect.top + firstRect.height / 2 - containerRect.top;
    const bottom = lastRect.top + lastRect.height / 2 - containerRect.top;
    setLineStyle({ top, height: bottom - top });
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(measureLine);
    window.addEventListener("resize", measureLine);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measureLine);
    };
  }, [moments, measureLine]);

  // Realtime subscription + visibility fallback
  useRealtimeRefresh("moments");
  useRealtimeRefresh("moment_likes");

  if (moments.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-24">
        <div className="mb-4 text-5xl">🌚 🤓</div>
        <h2 className="mb-2 text-lg font-semibold text-foreground">
          Noch keine Momente
        </h2>
        <p className="text-center text-sm text-muted-foreground">
          Erstellt euren ersten Moment zusammen
        </p>
        <FAB href="/create" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full mx-auto mb-4 max-w-lg px-4 pt-4"
    >
      {/* Left spine */}
      {lineStyle && (
        <div
          className="absolute left-9 w-px -translate-x-1/2 bg-border"
          style={{ top: lineStyle.top, height: lineStyle.height }}
        />
      )}

      <div className="space-y-5">
        {moments.map((moment) => (
          <TimelineItem
            key={moment.id}
            moment={moment}
            currentUserId={currentUserId}
            onSelect={() => setSelectedMoment(moment)}
          />
        ))}
      </div>

      <FAB href="/create" />
      <MomentDetailDrawer
        moment={selectedMoment}
        currentUserId={currentUserId}
        isOwn={selectedMoment?.author_id === currentUserId}
        onOpenChange={(open) => {
          if (!open) setSelectedMoment(null);
        }}
      />
    </div>
  );
}
