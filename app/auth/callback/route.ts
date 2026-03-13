import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile, normalizeEmail } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get the authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        // Upsert profile based on email → constants mapping
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

      return NextResponse.redirect(origin);
    }
  }

  // Auth failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
