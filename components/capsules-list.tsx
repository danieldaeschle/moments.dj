"use client";

import { useState, useEffect, useMemo } from "react";
import { CapsuleCard, SentCapsuleCard } from "@/components/capsule-card";
import { FAB } from "@/components/fab";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import { CloudRain, ChevronDown, ChevronRight, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { openBadDayCapsule } from "@/app/(app)/capsules/actions";
import { toast } from "sonner";
import type { CapsuleWithProfiles } from "@/lib/types";

const MAX_SECTION_PREVIEW = 5;

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
  const router = useRouter();
  const [capsules, setCapsules] = useState(initial);
  const [sentExpanded, setSentExpanded] = useState(false);
  const [badDayLoading, setBadDayLoading] = useState(false);
  const [justOpenedId, setJustOpenedId] = useState<string | null>(null);

  useEffect(() => {
    setCapsules(initial);
  }, [initial]);

  useRealtimeRefresh("memory_capsules");

  // Capsules the partner created for me
  const received = capsules.filter((c) => c.recipient_id === currentUserId);
  const receivedBadDay = received.filter(
    (c) => c.trigger_type === "bad_day" && !c.opened_at,
  );
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

  async function handleBadDay() {
    setBadDayLoading(true);
    const result = await openBadDayCapsule();
    if (result.error) {
      toast.error(result.error);
    }
    setBadDayLoading(false);
  }

  return (
    <div
      className={`mx-auto w-full max-w-lg px-4 pb-32 pt-4 ${capsules.length === 0 ? "flex flex-1 flex-col" : ""}`}
    >
      {/* Bad Day Button – always visible */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <button
          type="button"
          onClick={handleBadDay}
          disabled={badDayLoading || receivedBadDay.length === 0}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-rose-500/15 px-6 py-4 text-rose-700 shadow-sm transition-all active:scale-[0.98] hover:bg-rose-500/25 disabled:opacity-50 dark:text-rose-300"
        >
          <CloudRain className="h-5 w-5 shrink-0" />
          <span className="text-sm font-semibold">
            {badDayLoading
              ? "Kapsel wird geöffnet…"
              : receivedBadDay.length === 0
                ? "Keine Kapseln für schlechte Tage"
                : "Ich habe einen schlechten Tag"}
          </span>
        </button>
      </motion.div>

      {/* Locked Capsules – only from partner */}
      {receivedLocked.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Verschlossene Kapseln ({receivedLocked.length})
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {receivedLocked.slice(0, MAX_SECTION_PREVIEW).map((capsule) => (
                <CapsuleCard
                  key={capsule.id}
                  capsule={capsule}
                  isRecipient
                  onOpened={(id) => setJustOpenedId(id)}
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

      {/* Opened Capsules – only from partner */}
      {receivedOpened.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Geöffnete Kapseln ({receivedOpened.length})
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {receivedOpened.slice(0, MAX_SECTION_PREVIEW).map((capsule) => (
                <CapsuleCard
                  key={capsule.id}
                  capsule={capsule}
                  isRecipient
                  defaultExpanded={capsule.id === justOpenedId}
                />
              ))}
            </AnimatePresence>
          </div>
          {receivedOpened.length > MAX_SECTION_PREVIEW && (
            <Link
              href="/capsules/opened"
              className="mt-4 flex items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              Alle geöffneten Kapseln
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </section>
      )}

      {/* Empty state */}
      {capsules.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="mb-4 text-5xl">💊</div>
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
                    <SentCapsuleCard key={capsule.id} capsule={capsule} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      <FAB onClick={() => router.push("/capsules/create")} />
    </div>
  );
}
