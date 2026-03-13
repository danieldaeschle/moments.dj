"use server";

import {
  ALLOWED_EMAILS,
  USER_PROFILES,
  getUserProfile,
  normalizeEmail,
} from "@/lib/constants";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

const USER_KEYS: Record<string, (typeof ALLOWED_EMAILS)[number]> = {
  daniel: "daniel.daeschle@gmail.com",
  johanna: "jhnn.m@hotmail.de",
};

export async function sendMagicLink(userKey: string) {
  const email = USER_KEYS[userKey];
  if (!email) {
    return { error: "Unbekannter Benutzer" };
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

export async function devLogin(userKey: string) {
  if (process.env.NODE_ENV !== "development") {
    return { error: "Dev login is only available in development mode" };
  }

  const email = USER_KEYS[userKey];
  if (!email) {
    return { error: "Unbekannter Benutzer" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error || !data) {
    return { error: error?.message ?? "Failed to generate link" };
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: data.properties.hashed_token,
    type: "email",
  });

  if (verifyError) {
    return { error: verifyError.message };
  }

  // Upsert profile (same as auth/callback)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    const normalizedEmail = normalizeEmail(user.email);
    const profile = getUserProfile(user.email);
    if (profile) {
      await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: normalizedEmail,
          display_name: profile.displayName,
          emoji: profile.emoji,
        },
        { onConflict: "id" },
      );
    }
  }

  return { success: true };
}
