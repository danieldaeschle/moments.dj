"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { openCapsule } from "@/app/(app)/capsules/actions";
import { toast } from "sonner";
import { TRIGGER_LABELS } from "@/lib/constants";
import { getImageUrl } from "@/lib/image-utils";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { CapsuleWithProfiles } from "@/lib/types";
import Image from "next/image";

type CapsuleCardProps = {
  capsule: CapsuleWithProfiles;
  isRecipient: boolean;
  onOpened?: (id: string) => void;
  defaultExpanded?: boolean;
};

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

export function CapsuleCard({
  capsule,
  isRecipient,
  onOpened,
  defaultExpanded,
}: CapsuleCardProps) {
  const [opening, setOpening] = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);
  const [justOpened, setJustOpened] = useState(false);
  const isOpen = !!capsule.opened_at || justOpened;

  async function handleTap() {
    // Already opened → toggle expand/collapse
    if (isOpen) {
      setExpanded(!expanded);
      return;
    }

    // Locked but openable → open it
    if (isRecipient && canOpen(capsule)) {
      setOpening(true);
      const result = await openCapsule(capsule.id);
      if (result.error) {
        toast.error(result.error);
        setOpening(false);
        return;
      }
      setJustOpened(true);
      setExpanded(true);
      setOpening(false);
      onOpened?.(capsule.id);
    }
  }

  const isInteractive = isOpen || (isRecipient && canOpen(capsule));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        layout
        onClick={isInteractive ? handleTap : undefined}
        style={{ borderRadius: expanded ? 24 : 9999 }}
        transition={{ layout: { duration: 0.3 } }}
        className={`
          relative select-none overflow-hidden border-2 transition-colors
          ${isInteractive ? "cursor-pointer" : ""}
          ${isOpen ? "border-primary/20" : canOpen(capsule) ? "border-primary/30" : "border-muted-foreground/10"}
          ${opening ? "animate-pulse" : ""}
          ${expanded ? "col-span-2" : ""}
        `}
      >
        {/* Two-tone background for locked capsules */}
        {!isOpen && (
          <div className="absolute inset-0 flex">
            <div
              className={`w-1/2 ${canOpen(capsule) ? "bg-red-500/20" : "bg-red-500/10"}`}
            />
            <div
              className={`w-1/2 ${canOpen(capsule) ? "bg-muted/50" : "bg-muted/35"}`}
            />
          </div>
        )}

        {/* Gradient background for opened capsules */}
        {isOpen && (
          <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-primary/5" />
        )}

        {/* Capsule header — always visible */}
        <div className="relative flex h-12 items-center gap-2 px-2">
          {!isOpen && (
            <Lock
              className={`h-3.5 w-3.5 shrink-0 ${canOpen(capsule) ? "text-primary/60" : "text-muted-foreground/60"}`}
            />
          )}
          {isOpen && (
            <span className="text-base shrink-0">{capsule.author.emoji}</span>
          )}

          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-xs font-medium ${!isOpen ? (canOpen(capsule) ? "text-foreground" : "text-muted-foreground") : ""}`}
            >
              {isOpen ? capsule.title : getHintText(capsule)}
            </p>
          </div>
        </div>

        {/* Expanded content — click to reveal */}
        <AnimatePresence>
          {expanded && isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="relative px-2 pb-2">
                <div className="rounded-xl bg-background/60 p-3">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {capsule.message}
                  </p>

                  {capsule.image_path && (
                    <Image
                      src={getImageUrl(capsule.image_path)}
                      alt=""
                      width={480}
                      height={360}
                      className="mt-3 w-full rounded-xl object-cover"
                    />
                  )}

                  <p className="mt-3 text-[10px] text-muted-foreground">
                    {format(new Date(capsule.created_at), "d. MMM yyyy", {
                      locale: de,
                    })}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

/* Compact card for "sent by me" section */
type SentCapsuleCardProps = {
  capsule: CapsuleWithProfiles;
};

export function SentCapsuleCard({ capsule }: SentCapsuleCardProps) {
  const isOpened = !!capsule.opened_at;

  return (
    <div
      className={`flex items-center gap-3 rounded-full border px-4 py-2.5 transition-colors ${
        isOpened ? "border-primary/20 bg-primary/5" : "border-muted bg-muted/20"
      }`}
    >
      <span className="text-base shrink-0">{isOpened ? "✅" : "💊"}</span>

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
        <EyeOff className="h-4 w-4 shrink-0 text-muted-foreground/50" />
      )}
    </div>
  );
}
