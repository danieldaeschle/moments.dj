"use client";

import { OpenedCapsuleCard } from "@/components/capsule-card";
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
        <div className="-mx-4 overflow-x-auto px-4 pb-2 no-scrollbar">
          <AnimatePresence mode="popLayout">
            <div className="flex w-max snap-x snap-mandatory gap-4 pr-4">
              {capsules.map((capsule) => (
                <OpenedCapsuleCard key={capsule.id} capsule={capsule} />
              ))}
            </div>
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 text-5xl">🕰️</div>
          <p className="text-sm text-muted-foreground">
            Noch keine geöffneten Kapseln
          </p>
        </div>
      )}
    </div>
  );
}
