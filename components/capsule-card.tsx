"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, LockKeyhole, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { deleteCapsule, openCapsule } from "@/app/(app)/capsules/actions";
import { toast } from "sonner";
import { TRIGGER_LABELS } from "@/lib/constants";
import { getImageUrl } from "@/lib/image-utils";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { CapsuleWithProfiles } from "@/lib/types";
import Image from "next/image";

function canOpen(capsule: CapsuleWithProfiles) {
  if (capsule.opened_at) return false;
  if (capsule.trigger_type === "manual") return true;
  if (capsule.trigger_type === "bad_day") return false;
  if (capsule.trigger_type === "date" && capsule.open_at) {
    return new Date(capsule.open_at) <= new Date();
  }
  return false;
}

function getHintText(capsule: CapsuleWithProfiles) {
  if (canOpen(capsule)) return "Tippe zum Öffnen";
  switch (capsule.trigger_type) {
    case "bad_day":
      return "Für einen schlechten Tag";
    case "date":
      if (capsule.open_at) {
        return `Ab ${format(new Date(capsule.open_at), "d. MMMM", { locale: de })}`;
      }
      return "Bald verfügbar";
    case "manual":
      return "Tippe zum Öffnen";
  }
}

/* ── Metallic weld seam ──────────────────────────────── */

function WeldSeam({ className }: { className?: string }) {
  return (
    <div className={`absolute inset-x-3 h-0.5 ${className ?? ""}`}>
      <div className="h-full rounded-full bg-linear-to-r from-transparent via-slate-400/40 to-transparent dark:via-slate-500/30" />
      <div className="absolute inset-x-2 top-px h-px rounded-full bg-linear-to-r from-transparent via-white/25 to-transparent" />
    </div>
  );
}

/* ── Opening overlay ─────────────────────────────────── */

type OverlayProps = {
  capsule: CapsuleWithProfiles;
  onClose: () => void;
  onOpened: (id: string, openedAt: string) => void;
  openAction?: (id: string) => Promise<{
    error?: string;
    capsule?: { opened_at: string | null };
  }>;
};

export function CapsuleOpenOverlay({
  capsule,
  onClose,
  onOpened,
  openAction,
}: OverlayProps) {
  const [phase, setPhase] = useState<"shaking" | "revealed">("shaking");
  const [openedAt, setOpenedAt] = useState<string | null>(null);

  async function handleShakeComplete() {
    const result = openAction
      ? await openAction(capsule.id)
      : await openCapsule(capsule.id);

    if (result.error) {
      toast.error(result.error);
      onClose();
      return;
    }

    setOpenedAt(result.capsule?.opened_at ?? new Date().toISOString());
    setPhase("revealed");
  }

  function handleClose() {
    onOpened(capsule.id, openedAt ?? new Date().toISOString());
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md"
    >
      <AnimatePresence mode="wait">
        {phase === "shaking" && (
          <motion.div
            key="canister"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.3, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center"
          >
            <motion.div
              animate={{ rotate: [0, -8, 8, -8, 8, -5, 5, -3, 3, 0] }}
              transition={{ duration: 1, delay: 0.4, ease: "easeInOut" }}
              onAnimationComplete={handleShakeComplete}
              className="relative isolate w-28 min-h-48 overflow-hidden rounded-xs border border-slate-400/50 bg-linear-to-r from-slate-400/70 via-slate-200 to-slate-400/70 px-3 py-6 text-center shadow-[0_20px_60px_-20px_rgba(15,23,42,0.5)] dark:border-slate-500/40 dark:from-slate-600/80 dark:via-slate-500 dark:to-slate-600/80"
            >
              {/* Top cap highlight */}
              <div className="absolute inset-x-0 top-0 h-5 bg-linear-to-b from-white/35 to-transparent dark:from-white/12" />
              {/* Weld seams */}
              <WeldSeam className="top-[15%]" />
              <WeldSeam className="bottom-[15%]" />
              {/* Bottom shadow */}
              <div className="absolute inset-x-0 bottom-0 h-4 bg-linear-to-t from-black/8 to-transparent" />

              <div className="relative flex h-full flex-col items-center justify-center" />
            </motion.div>
          </motion.div>
        )}

        {phase === "revealed" && (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mx-6 w-full max-w-sm"
          >
            <div className="rounded-2xl border bg-background p-6 shadow-xl">
              <p className="text-xs text-muted-foreground">
                {format(
                  new Date(openedAt ?? new Date().toISOString()),
                  "d. MMM yyyy",
                  { locale: de },
                )}
              </p>
              <p className="mt-1 text-base font-semibold">{capsule.title}</p>
              <div className="my-4 h-px bg-border" />
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {capsule.message}
              </p>

              {capsule.image_path && (
                <Image
                  src={getImageUrl(capsule.image_path)}
                  alt=""
                  width={480}
                  height={360}
                  className="mt-4 w-full rounded-xl object-cover"
                />
              )}

              <button
                type="button"
                onClick={handleClose}
                className="mt-6 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors active:bg-primary/90"
              >
                Erinnerung behalten
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Locked capsule card (metallic canister) ──────────── */

type CapsuleCardProps = {
  capsule: CapsuleWithProfiles;
  isRecipient: boolean;
  onOpened?: (id: string, openedAt: string) => void;
  onOverlayChange?: (open: boolean) => void;
};

export function CapsuleCard({
  capsule,
  isRecipient,
  onOpened,
  onOverlayChange,
}: CapsuleCardProps) {
  const [showOverlay, setShowOverlay] = useState(false);
  const openable = isRecipient && canOpen(capsule);

  function handleOpenOverlay() {
    setShowOverlay(true);
    onOverlayChange?.(true);
  }

  function handleCloseOverlay() {
    setShowOverlay(false);
    onOverlayChange?.(false);
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="flex justify-center py-2"
      >
        <div
          onClick={openable ? handleOpenOverlay : undefined}
          className={
            openable
              ? "cursor-pointer transition-transform duration-200 hover:-translate-y-1 active:translate-y-0 active:scale-[0.97]"
              : "opacity-75"
          }
        >
          {/* Canister body */}
          <div
            className={`relative flex items-center justify-center isolate w-20 min-h-36 select-none overflow-hidden rounded-xs px-2 py-5rotate- ${
              openable
                ? "border-slate-400/60 bg-linear-to-r from-slate-400/60 via-slate-200 to-slate-400/60 shadow-[0_16px_40px_-18px_rgba(15,23,42,0.6)] dark:border-slate-500/50 dark:from-slate-600/70 dark:via-slate-500 dark:to-slate-600/70"
                : "border-slate-300/50 bg-linear-to-r from-slate-300/50 via-slate-100 to-slate-300/50 shadow-[0_10px_30px_-16px_rgba(15,23,42,0.4)] dark:border-slate-600/40 dark:from-slate-700/60 dark:via-slate-600 dark:to-slate-700/60"
            }`}
          >
            {/* Top cap highlight */}
            <div className="absolute inset-x-0 top-0 h-5 bg-linear-to-b from-white/30 to-transparent dark:from-white/10" />
            {/* Weld seams */}
            <WeldSeam className="top-[15%]" />
            <WeldSeam className="bottom-[15%]" />
            {/* Bottom shadow */}
            <div className="absolute inset-x-0 bottom-0 h-4 bg-linear-to-t from-black/8 to-transparent" />

            {/* Content */}
            <div className="relative flex h-full flex-col items-center justify-center gap-2">
              {!openable && (
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border shadow-inner border-slate-300/40 bg-slate-200/60 dark:border-slate-600/40 dark:bg-slate-600/40">
                  <LockKeyhole className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                </div>
              )}

              <p
                className={`line-clamp-2 text-center text-[9px] leading-tight ${
                  openable
                    ? "text-slate-500 dark:text-slate-400"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {getHintText(capsule)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showOverlay && (
          <CapsuleOpenOverlay
            capsule={capsule}
            onClose={handleCloseOverlay}
            onOpened={(id, openedAt) => onOpened?.(id, openedAt)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Opened capsule card (reel / lookback style) ──────── */

type OpenedCapsuleCardProps = {
  capsule: CapsuleWithProfiles;
};

export function OpenedCapsuleCard({ capsule }: OpenedCapsuleCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const hasImage = !!capsule.image_path;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        onClick={() => setShowDetail(true)}
        className="relative h-44 w-36 shrink-0 cursor-pointer snap-start select-none overflow-hidden rounded-xl border border-border/60 shadow-sm transition-transform active:scale-[0.97]"
      >
        {hasImage ? (
          <Image
            src={getImageUrl(capsule.image_path!)}
            alt=""
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900" />
        )}
        {/* Text overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 via-black/40 to-transparent px-2.5 pb-2.5 pt-8">
          <p className="text-[10px] text-white/70">
            {format(new Date(capsule.opened_at!), "d. MMM yyyy", {
              locale: de,
            })}
          </p>
          <p className="truncate text-xs font-semibold text-white">
            {capsule.title}
          </p>
          {capsule.message && (
            <p className="mt-0.5 line-clamp-3 text-[10px] leading-tight text-white/80">
              {capsule.message}
            </p>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-md"
            onClick={() => setShowDetail(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.9 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="mx-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rounded-2xl border bg-background p-6 shadow-xl">
                <p className="mb-1 text-xs text-muted-foreground">
                  {format(new Date(capsule.opened_at!), "d. MMM yyyy", {
                    locale: de,
                  })}
                </p>
                <p className="text-base font-semibold">{capsule.title}</p>
                <div className="my-4 h-px bg-border" />
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {capsule.message}
                </p>

                {capsule.image_path && (
                  <Image
                    src={getImageUrl(capsule.image_path)}
                    alt=""
                    width={480}
                    height={360}
                    className="mt-4 w-full rounded-xl object-cover"
                  />
                )}

                <p className="mt-4 text-center text-[10px] text-muted-foreground">
                  Von {capsule.author.display_name} ·{" "}
                  {format(new Date(capsule.created_at), "d. MMM yyyy", {
                    locale: de,
                  })}
                </p>

                <button
                  type="button"
                  onClick={() => setShowDetail(false)}
                  className="mt-6 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors active:bg-primary/90"
                >
                  Schließen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Sent capsule card ────────────────────────────────── */

type SentCapsuleCardProps = {
  capsule: CapsuleWithProfiles;
  onDeleted?: (id: string) => void;
};

export function SentCapsuleCard({ capsule, onDeleted }: SentCapsuleCardProps) {
  const isOpened = !!capsule.opened_at;
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleDelete() {
    startDeleteTransition(async () => {
      const result = await deleteCapsule(capsule.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Kapsel gelöscht");
      onDeleted?.(capsule.id);
    });
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
        isOpened
          ? "border-primary/20 bg-primary/5"
          : "border-slate-200/80 bg-linear-to-r from-slate-50 to-white dark:border-slate-700/50 dark:from-slate-800 dark:to-slate-800/80"
      }`}
    >
      <span className="shrink-0 text-base">{isOpened ? "✅" : "🕰️"}</span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{capsule.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {isOpened
            ? `Angeschaut am ${format(new Date(capsule.opened_at!), "d. MMM", { locale: de })}`
            : TRIGGER_LABELS[capsule.trigger_type]}
        </p>
      </div>

      {isOpened ? (
        <Eye className="h-4 w-4 shrink-0 text-primary" />
      ) : (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            aria-label="Kapsel löschen"
          >
            <Trash2 className="h-4 w-4 shrink-0" />
          </button>
          <EyeOff className="h-4 w-4 shrink-0 text-muted-foreground/50" />
        </div>
      )}
    </div>
  );
}
