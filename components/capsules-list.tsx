"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CapsuleCard,
  CapsuleOpenOverlay,
  OpenedCapsuleCard,
  SentCapsuleCard,
} from "@/components/capsule-card";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CloudRain, ChevronDown, ChevronRight, Plus, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { CapsuleWithProfiles } from "@/lib/types";

const MAX_SECTION_PREVIEW = 5;
const FLOATING_OFFSET =
  process.env.NODE_ENV === "development" ? "bottom-22" : "bottom-6";

type Props = {
  capsules: CapsuleWithProfiles[];
  currentUserId: string;
  recipientName: string;
};

export function CapsulesList({
  capsules: initial,
  currentUserId,
  recipientName,
}: Props) {
  const [capsules, setCapsules] = useState(initial);
  const [sentExpanded, setSentExpanded] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [badDayOverlayCapsule, setBadDayOverlayCapsule] =
    useState<CapsuleWithProfiles | null>(null);

  useEffect(() => {
    if (!overlayOpen) {
      setCapsules(initial);
    }
  }, [initial, overlayOpen]);

  useRealtimeRefresh("memory_capsules");

  // Capsules the partner created for me
  const received = capsules.filter((c) => c.recipient_id === currentUserId);
  const receivedBadDay = received.filter(
    (c) => c.trigger_type === "bad_day" && !c.opened_at,
  );
  const nextBadDayCapsule = receivedBadDay[0] ?? null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => Date.now(), [capsules]);
  const receivedLocked = received
    .filter((c) => !c.opened_at && c.trigger_type !== "bad_day")
    .sort((a, b) => {
      const aManual = a.trigger_type === "manual";
      const bManual = b.trigger_type === "manual";
      if (aManual !== bManual) return aManual ? -1 : 1;

      const aOpenable =
        a.trigger_type === "date" &&
        a.open_at &&
        new Date(a.open_at).getTime() <= now;
      const bOpenable =
        b.trigger_type === "date" &&
        b.open_at &&
        new Date(b.open_at).getTime() <= now;
      if (aOpenable !== bOpenable) return aOpenable ? -1 : 1;

      if (!a.open_at && !b.open_at) return 0;
      if (!a.open_at) return 1;
      if (!b.open_at) return -1;
      return new Date(a.open_at).getTime() - new Date(b.open_at).getTime();
    });
  const receivedOpened = received
    .filter((c) => c.opened_at)
    .sort(
      (a, b) =>
        new Date(b.opened_at!).getTime() - new Date(a.opened_at!).getTime(),
    );

  // Capsules I created for the partner
  const sent = capsules.filter((c) => c.author_id === currentUserId);
  const sentOpenedCount = sent.filter((c) => c.opened_at).length;

  const hasReceived =
    receivedLocked.length > 0 ||
    receivedOpened.length > 0 ||
    receivedBadDay.length > 0;

  function handleSentDeleted(id: string) {
    setCapsules((prev) => prev.filter((capsule) => capsule.id !== id));
  }

  function handleCapsuleOpened(id: string, openedAt: string) {
    setCapsules((prev) =>
      prev.map((capsule) =>
        capsule.id === id ? { ...capsule, opened_at: openedAt } : capsule,
      ),
    );
  }

  function handleBadDayOverlayOpen() {
    if (!nextBadDayCapsule) {
      return;
    }

    setBadDayOverlayCapsule(nextBadDayCapsule);
    setOverlayOpen(true);
  }

  function handleBadDayOverlayClose() {
    setBadDayOverlayCapsule(null);
    setOverlayOpen(false);
  }

  return (
    <>
      <div
        className={`mx-auto w-full max-w-lg px-4 pb-32 pt-4 ${capsules.length === 0 ? "flex flex-1 flex-col" : ""}`}
      >
        {/* Opened Capsules – horizontal scroll, no heading */}
        {receivedOpened.length > 0 && (
          <section className="mb-8">
            <div className="-mx-4 overflow-x-auto px-4 pb-2 no-scrollbar">
              <AnimatePresence mode="popLayout">
                <div className="flex w-max snap-x snap-mandatory gap-3 pr-4">
                  {receivedOpened.map((capsule) => (
                    <OpenedCapsuleCard key={capsule.id} capsule={capsule} />
                  ))}
                </div>
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Locked Capsules – only from partner */}
        {receivedLocked.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Verschlossene Kapseln ({receivedLocked.length})
            </h2>
            <div className="flex flex-wrap gap-3">
              <AnimatePresence mode="popLayout">
                {receivedLocked.slice(0, MAX_SECTION_PREVIEW).map((capsule) => (
                  <CapsuleCard
                    key={capsule.id}
                    capsule={capsule}
                    isRecipient
                    onOpened={handleCapsuleOpened}
                    onOverlayChange={setOverlayOpen}
                  />
                ))}
              </AnimatePresence>
            </div>
            {receivedLocked.length > MAX_SECTION_PREVIEW && (
              <Link
                href="/capsules/locked"
                className="mt-4 flex items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                Alle verschlossenen Kapseln
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </section>
        )}

        {/* Empty state */}
        {capsules.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="mb-4 text-5xl">🕰️</div>
            <h2 className="mb-2 text-lg font-semibold">Noch keine Kapseln</h2>
            <p className="text-center text-sm text-muted-foreground">
              Erstelle eine Kapsel für {recipientName}
            </p>
          </div>
        )}

        {!hasReceived && sent.length > 0 && (
          <div className="mt-8 flex flex-col items-center justify-center text-center">
            <div className="mb-3 text-4xl">💌</div>
            <p className="text-sm text-muted-foreground">
              Noch keine Kapseln von {recipientName} erhalten
            </p>
          </div>
        )}

        {/* Sent Capsules – show partner view status */}
        {sent.length > 0 && (
          <section className="mt-8">
            <button
              type="button"
              onClick={() => setSentExpanded(!sentExpanded)}
              className="flex w-full items-center gap-2 text-left"
            >
              <Send className="h-3.5 w-3.5 text-muted-foreground" />
              <h2 className="flex-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Gesendete Kapseln ({sentOpenedCount}/{sent.length} angeschaut)
              </h2>
              <motion.span
                animate={{ rotate: sentExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </motion.span>
            </button>

            <AnimatePresence>
              {sentExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-2">
                    {sent.map((capsule) => (
                      <SentCapsuleCard
                        key={capsule.id}
                        capsule={capsule}
                        onDeleted={handleSentDeleted}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}
      </div>

      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4",
          FLOATING_OFFSET,
        )}
      >
        <div className="flex w-full max-w-lg items-center justify-end gap-3">
          <AnimatePresence>
            {nextBadDayCapsule && (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.96 }}
                onClick={handleBadDayOverlayOpen}
                className="pointer-events-auto flex h-14 max-w-[calc(100vw-7rem)] items-center gap-2 rounded-full bg-slate-700 px-5 text-sm font-semibold text-white shadow-lg transition-transform active:scale-95"
              >
                🥺 Heute ist doof
              </motion.button>
            )}
          </AnimatePresence>

          <Link
            href="/capsules/create"
            className={cn(
              buttonVariants({ size: "icon" }),
              "pointer-events-auto h-14 w-14 rounded-full shadow-lg",
            )}
          >
            <Plus className="h-6 w-6" />
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {badDayOverlayCapsule && (
          <CapsuleOpenOverlay
            capsule={badDayOverlayCapsule}
            onClose={handleBadDayOverlayClose}
            onOpened={handleCapsuleOpened}
          />
        )}
      </AnimatePresence>
    </>
  );
}
