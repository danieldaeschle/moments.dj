"use client";

import { useSwUpdate } from "@/hooks/use-sw-update";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function UpdatePrompt() {
  const { updateAvailable, applyUpdate } = useSwUpdate();

  if (!updateAvailable) return null;

  return (
    <div className="fixed inset-x-0 top-16 z-50 p-4">
      <div className="mx-auto flex max-w-lg items-center gap-3 rounded-xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur-sm">
        <RefreshCw className="h-5 w-5 shrink-0 text-primary" />
        <p className="flex-1 text-sm">Eine neue Version ist verfügbar</p>
        <Button size="sm" onClick={applyUpdate}>
          Aktualisieren
        </Button>
      </div>
    </div>
  );
}
