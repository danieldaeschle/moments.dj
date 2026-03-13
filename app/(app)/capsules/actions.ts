"use server";

import { getPartnerProfile } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendPushToUser } from "@/lib/push";

export async function createCapsule(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Nicht angemeldet" };
  }

  const title = formData.get("title") as string;
  const message = formData.get("message") as string;
  const imagePath = (formData.get("image_path") as string) || null;
  const triggerType = formData.get("trigger_type") as string;
  const openAt = (formData.get("open_at") as string) || null;

  if (!title?.trim()) {
    return { error: "Titel ist erforderlich" };
  }
  if (!message?.trim()) {
    return { error: "Nachricht ist erforderlich" };
  }
  if (!["bad_day", "date", "manual"].includes(triggerType)) {
    return { error: "Ungültiger Auslöser" };
  }
  if (triggerType === "date" && !openAt) {
    return { error: "Für datierte Kapseln ist ein Datum erforderlich" };
  }

  const partnerProfile = getPartnerProfile(user.email);
  if (!partnerProfile) {
    return { error: "Empfänger-Konfiguration nicht gefunden" };
  }

  const { data: recipient } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", partnerProfile.email)
    .maybeSingle();

  if (!recipient) {
    return {
      error:
        "Empfänger nicht gefunden. Der andere Account muss sich einmal anmelden.",
    };
  }

  const { error } = await supabase.from("memory_capsules").insert({
    author_id: user.id,
    recipient_id: recipient.id,
    title: title.trim(),
    message: message.trim(),
    image_path: imagePath,
    trigger_type: triggerType,
    open_at: openAt ? new Date(openAt + "T00:00:00").toISOString() : null,
  });

  if (error) {
    return { error: error.message };
  }

  // Notify recipient
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const authorName = profile?.display_name || "Jemand";

  await sendPushToUser(recipient.id, {
    title: "Neue Kapsel 💊",
    body: `${authorName} hat dir eine Kapsel geschickt`,
    url: "/capsules",
  });

  revalidatePath("/capsules");
  return { success: true };
}

export async function openCapsule(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Nicht angemeldet" };
  }

  // Verify capsule exists and user is recipient
  const { data: capsule } = await supabase
    .from("memory_capsules")
    .select("*")
    .eq("id", id)
    .single();

  if (!capsule) {
    return { error: "Kapsel nicht gefunden" };
  }

  if (capsule.recipient_id !== user.id) {
    return { error: "Nicht berechtigt" };
  }

  if (capsule.opened_at) {
    return { error: "Kapsel wurde bereits geöffnet" };
  }

  // For date capsules, check if it's time
  if (capsule.trigger_type === "date" && capsule.open_at) {
    if (new Date(capsule.open_at) > new Date()) {
      return { error: "Diese Kapsel kann noch nicht geöffnet werden" };
    }
  }

  const { data: updated, error } = await supabase
    .from("memory_capsules")
    .update({ opened_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error || !updated) {
    return { error: error?.message ?? "Kapsel konnte nicht geöffnet werden" };
  }

  revalidatePath("/capsules");
  return { success: true, capsule: updated };
}

export async function openBadDayCapsule() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Nicht angemeldet" };
  }

  const { data: capsules } = await supabase
    .from("memory_capsules")
    .select("*")
    .eq("trigger_type", "bad_day")
    .eq("recipient_id", user.id)
    .is("opened_at", null)
    .limit(1);

  if (!capsules?.length) {
    return { empty: true };
  }

  const capsule = capsules[0];

  const { data: updated, error } = await supabase
    .from("memory_capsules")
    .update({ opened_at: new Date().toISOString() })
    .eq("id", capsule.id)
    .select()
    .single();

  if (error || !updated) {
    return { error: error?.message ?? "Kapsel konnte nicht geöffnet werden" };
  }

  revalidatePath("/capsules");
  return { success: true, capsuleId: capsule.id };
}
