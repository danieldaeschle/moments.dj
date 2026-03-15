"use server";

import { getPartnerProfile } from "@/lib/constants";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendPushToUser } from "@/lib/push";
import { after } from "next/server";

export async function createMoment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Nicht angemeldet" };
  }

  const title = formData.get("title") as string;
  const text = (formData.get("text") as string) || null;
  const imagePath = (formData.get("image_path") as string) || null;
  const momentDate =
    (formData.get("moment_date") as string) ||
    new Date().toISOString().slice(0, 10);

  if (!title?.trim()) {
    return { error: "Titel ist erforderlich" };
  }

  const { error } = await supabase.from("moments").insert({
    author_id: user.id,
    title: title.trim(),
    text: text?.trim() || null,
    image_path: imagePath,
    moment_date: momentDate,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");

  const userEmail = user.email;
  const userId = user.id;
  after(async () => {
    try {
      const partnerProfile = getPartnerProfile(userEmail);
      if (partnerProfile) {
        // Use admin client because after() runs post-response,
        // where cookies (needed by createClient) may not be available.
        const supabaseAfter = createAdminClient();
        const { data: otherUser } = await supabaseAfter
          .from("profiles")
          .select("id")
          .ilike("email", partnerProfile.email)
          .maybeSingle();

        if (otherUser) {
          const { data: profile } = await supabaseAfter
            .from("profiles")
            .select("display_name")
            .eq("id", userId)
            .single();

          const authorName = profile?.display_name || "Jemand";

          await sendPushToUser(otherUser.id, {
            title: "Neuer Moment ✨",
            body: `${authorName}: ${title.trim()}`,
            url: "/",
          });
        }
      }
    } catch {
      // Push notification failure should not break moment creation
    }
  });

  return { success: true };
}
export async function updateMoment(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Nicht angemeldet" };
  }

  const { data: existing } = await supabase
    .from("moments")
    .select("author_id, image_path")
    .eq("id", id)
    .single();

  if (!existing) {
    return { error: "Moment nicht gefunden" };
  }

  if (existing.author_id !== user.id) {
    return { error: "Nicht berechtigt" };
  }

  const title = formData.get("title") as string;
  const text = (formData.get("text") as string) || null;
  const imagePath = formData.get("image_path") as string | null;
  const removeImage = formData.get("remove_image") === "true";
  const momentDate = (formData.get("moment_date") as string) || undefined;

  if (!title?.trim()) {
    return { error: "Titel ist erforderlich" };
  }

  // If image was removed or replaced, delete old image from storage
  if (
    existing.image_path &&
    (removeImage || (imagePath && imagePath !== existing.image_path))
  ) {
    await supabase.storage.from("moment-images").remove([existing.image_path]);
  }

  const updates: Record<string, unknown> = {
    title: title.trim(),
    text: text?.trim() || null,
  };

  if (removeImage) {
    updates.image_path = null;
  } else if (imagePath) {
    updates.image_path = imagePath;
  }

  if (momentDate) {
    updates.moment_date = momentDate;
  }

  const { error } = await supabase.from("moments").update(updates).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}
export async function deleteMoment(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Nicht angemeldet" };
  }

  // Fetch the moment to get its image_path for cleanup
  const { data: moment } = await supabase
    .from("moments")
    .select("image_path, author_id")
    .eq("id", id)
    .single();

  if (!moment) {
    return { error: "Moment nicht gefunden" };
  }

  if (moment.author_id !== user.id) {
    return { error: "Nicht berechtigt" };
  }

  // Delete image from storage if it exists
  if (moment.image_path) {
    await supabase.storage.from("moment-images").remove([moment.image_path]);
  }

  const { error } = await supabase.from("moments").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

export async function testPushNotification(): Promise<{
  ok: boolean;
  diagnostics: string[];
}> {
  const diagnostics: string[] = [];

  const hasPublicKey = !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const hasPrivateKey = !!process.env.VAPID_PRIVATE_KEY;
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  diagnostics.push(`VAPID public key: ${hasPublicKey ? "✅" : "❌"}`);
  diagnostics.push(`VAPID private key: ${hasPrivateKey ? "✅" : "❌"}`);
  diagnostics.push(`Service role key: ${hasServiceKey ? "✅" : "❌"}`);

  if (!hasPublicKey || !hasPrivateKey) {
    diagnostics.push("⛔ VAPID-Keys fehlen → Push kann nicht gesendet werden");
    return { ok: false, diagnostics };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    diagnostics.push("⛔ Nicht angemeldet");
    return { ok: false, diagnostics };
  }

  diagnostics.push(`User: ${user.email}`);

  const admin = createAdminClient();
  const { data: subs, error: subError } = await admin
    .from("push_subscriptions")
    .select("endpoint")
    .eq("user_id", user.id);

  if (subError) {
    diagnostics.push(`⛔ DB-Fehler: ${subError.message}`);
    return { ok: false, diagnostics };
  }

  diagnostics.push(`Push-Subscriptions: ${subs?.length ?? 0}`);

  if (!subs?.length) {
    diagnostics.push(
      "⛔ Keine Subscriptions → Browser hat Push nicht registriert",
    );
    return { ok: false, diagnostics };
  }

  try {
    await sendPushToUser(user.id, {
      title: "Test-Notification 🔔",
      body: "Push funktioniert!",
      url: "/",
    });
    diagnostics.push("✅ Push gesendet");
    return { ok: true, diagnostics };
  } catch (err) {
    diagnostics.push(
      `⛔ Push fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`,
    );
    return { ok: false, diagnostics };
  }
}
