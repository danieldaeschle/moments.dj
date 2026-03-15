"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { Archive, LogOut, Sparkle } from "lucide-react";
import { InstallPrompt } from "@/components/install-prompt";
import { UpdatePrompt } from "@/components/update-prompt";
import { useSwUpdate } from "@/hooks/use-sw-update";
import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { testPushNotification } from "@/app/(app)/actions";

const isDev = process.env.NODE_ENV === "development";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
};

export function AppShell({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { updateAvailable, applyUpdate } = useSwUpdate();
  usePushNotifications();

  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTitleClick = useCallback(async () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      try {
        const result = await testPushNotification();
        toast(result.diagnostics.join("\n"), {
          duration: 10000,
        });
      } catch (err) {
        toast.error(
          `Server-Fehler: ${err instanceof Error ? err.message : String(err)}`,
          { duration: 10000 },
        );
      }
      return;
    }
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 800);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 items-center justify-between px-4">
          <h1
            className="text-base font-semibold tracking-tight cursor-pointer select-none"
            onClick={handleTitleClick}
          >
            Unsere Momente
          </h1>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-muted-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className={`flex flex-1 flex-col ${isDev ? "pb-16" : ""}`}>
        {children}
      </main>

      {isDev && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/80 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-lg items-stretch">
            <Link
              href="/"
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors",
                pathname === "/"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Sparkle className="h-5 w-5" />
              Momente
            </Link>
            <Link
              href="/capsules"
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors",
                pathname === "/capsules"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Archive className="h-5 w-5" />
              Kapseln
            </Link>
          </div>
        </nav>
      )}

      <Toaster position="top-center" />
      {updateAvailable ? (
        <UpdatePrompt applyUpdate={applyUpdate} />
      ) : (
        <InstallPrompt />
      )}
    </div>
  );
}
