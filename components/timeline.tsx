"use client";

import type { MomentWithAuthor } from "@/lib/types";
import { TimelineItem } from "@/components/timeline-item";
import { FAB } from "@/components/fab";
import { CreateMomentDrawer } from "@/components/create-moment-drawer";
import { MomentDetailDrawer } from "@/components/moment-detail-drawer";
import { useState } from "react";

type Props = {
  moments: MomentWithAuthor[];
  currentUserId: string;
};

export function Timeline({ moments, currentUserId }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedMoment, setSelectedMoment] = useState<MomentWithAuthor | null>(
    null,
  );

  if (moments.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-24">
        <div className="mb-4 text-5xl">🌚 🤓</div>
        <h2 className="mb-2 text-lg font-semibold text-foreground">
          No moments yet
        </h2>
        <p className="text-center text-sm text-muted-foreground">
          Create your first moment together
        </p>
        <FAB onClick={() => setCreateOpen(true)} />
        <CreateMomentDrawer open={createOpen} onOpenChange={setCreateOpen} />
      </div>
    );
  }

  return (
    <div className="relative w-full mx-auto max-w-lg px-4 pb-32 pt-6">
      {/* Center spine */}
      <div className="absolute top-0 bottom-8 left-1/2 w-px -translate-x-1/2 bg-border" />

      {/* Dot at the beginning of the timeline */}
      <div className="absolute left-1/2 bottom-8 h-3 w-3 -translate-x-1/2 rounded-full bg-primary" />

      <div className="space-y-5">
        {moments.map((moment) => (
          <TimelineItem
            key={moment.id}
            moment={moment}
            isOwn={moment.author_id === currentUserId}
            onSelect={() => setSelectedMoment(moment)}
          />
        ))}
      </div>

      <FAB onClick={() => setCreateOpen(true)} />
      <CreateMomentDrawer open={createOpen} onOpenChange={setCreateOpen} />
      <MomentDetailDrawer
        moment={selectedMoment}
        isOwn={selectedMoment?.author_id === currentUserId}
        onOpenChange={(open) => {
          if (!open) setSelectedMoment(null);
        }}
      />
    </div>
  );
}
