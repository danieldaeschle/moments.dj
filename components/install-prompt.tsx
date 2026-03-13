"use client";

import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { useState } from "react";

export function InstallPrompt() {
  const { canInstall, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="mx-auto flex max-w-lg items-center gap-3 rounded-xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur-sm">
        <Download className="h-5 w-5 shrink-0 text-primary" />
        <p className="flex-1 text-sm">
          App installieren für ein besseres Erlebnis
        </p>
        <Button size="sm" onClick={promptInstall}>
          Installieren
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
