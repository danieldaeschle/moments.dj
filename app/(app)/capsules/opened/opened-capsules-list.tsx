"use client";

import { CapsuleCard } from "@/components/capsule-card";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { CapsuleWithProfiles } from "@/lib/types";

type Props = {
  capsules: CapsuleWithProfiles[];
};

export function OpenedCapsulesList({ capsules }: Props) {
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
        Geöffnete Kapseln ({capsules.length})
      </h1>

      {capsules.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {capsules.map((capsule) => (
              <CapsuleCard key={capsule.id} capsule={capsule} isRecipient />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 text-5xl">💊</div>
          <p className="text-sm text-muted-foreground">
            Noch keine geöffneten Kapseln
          </p>
        </div>
      )}
    </div>
  );
}
