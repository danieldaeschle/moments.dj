"use client";

import type { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { LogOut, Sparkles } from "lucide-react";

type Props = {
  profile: Profile | null;
  otherProfile: Profile | null;
  children: React.ReactNode;
};

export function AppShell({ profile, otherProfile, children }: Props) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto grid h-14 max-w-lg grid-cols-[48px_1fr_48px] items-center px-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-center text-base font-semibold tracking-tight">
            Moments of D & J
          </h1>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8 text-muted-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>

      <Toaster position="top-center" />
    </div>
  );
}
