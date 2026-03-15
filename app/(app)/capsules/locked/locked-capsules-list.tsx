"use client";

import { useEffect, useState } from "react";
import { CapsuleCard } from "@/components/capsule-card";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { CapsuleWithProfiles } from "@/lib/types";

type Props = {
  capsules: CapsuleWithProfiles[];
};

export function LockedCapsulesList({ capsules }: Props) {
  const [items, setItems] = useState(capsules);
  const [overlayOpen, setOverlayOpen] = useState(false);

  useEffect(() => {
    if (!overlayOpen) {
      setItems(capsules);
    }
  }, [capsules, overlayOpen]);

  const visible = items.filter((capsule) => !capsule.opened_at);

  function handleCapsuleOpened(id: string, openedAt: string) {
    setItems((prev) =>
      prev.map((capsule) =>
        capsule.id === id ? { ...capsule, opened_at: openedAt } : capsule,
      ),
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-32 pt-4">
      <Link
        href="/capsules"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück
      </Link>

      <h1 className="mb-6 text-lg font-semibold">
        Verschlossene Kapseln ({visible.length})
      </h1>

      {visible.length > 0 ? (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 no-scrollbar">
          <AnimatePresence mode="popLayout">
            <div className="flex w-max items-center gap-3 pr-4">
              {visible.map((capsule) => (
                <CapsuleCard
                  key={capsule.id}
                  capsule={capsule}
                  isRecipient
                  onOpened={handleCapsuleOpened}
                  onOverlayChange={setOverlayOpen}
                />
              ))}
            </div>
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 text-5xl">🔓</div>
          <p className="text-sm text-muted-foreground">
            Keine verschlossenen Kapseln
          </p>
        </div>
      )}
    </div>
  );
}
