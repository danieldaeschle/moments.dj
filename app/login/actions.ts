"use server";

import { ALLOWED_EMAILS, USER_PROFILES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

const USER_KEYS: Record<string, (typeof ALLOWED_EMAILS)[number]> = {
  daniel: "daniel.daeschle@gmail.com",
  johanna: "jhnn.m@hotmail.de",
};

export async function sendMagicLink(userKey: string) {
  const email = USER_KEYS[userKey];
  if (!email) {
    return { error: "Unknown user" };
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin") || headerStore.get("referer") || "";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  const profile = USER_PROFILES[email];
  return { success: true, displayName: profile?.displayName ?? userKey };
}
