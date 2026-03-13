"use client";

import { useEffect, startTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to Supabase Realtime postgres_changes for a table
 * and calls router.refresh() on any change.
 * Also refreshes data when the tab regains visibility as a fallback.
 */
export function useRealtimeRefresh(table: string) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`${table}-changes`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        startTransition(() => {
          router.refresh();
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, router]);

  // Fallback: refresh when tab becomes visible again
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        startTransition(() => {
          router.refresh();
        });
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router]);
}
