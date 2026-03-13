"use server";

import { getPartnerProfile } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendPushToUser } from "@/lib/push";

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
  const momentDate = (formData.get("moment_date") as string) || new Date().toISOString().slice(0, 10);

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

  const partnerProfile = getPartnerProfile(user.email);
  if (!partnerProfile) {
    revalidatePath("/");
    return { success: true };
  }

  const { data: otherUser } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", partnerProfile.email)
    .maybeSingle();

  if (otherUser) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const authorName = profile?.display_name || "Jemand";

    await sendPushToUser(otherUser.id, {
      title: "Neuer Moment ✨",
      body: `${authorName}: ${title.trim()}`,
      url: "/",
    });
  }

  revalidatePath("/");
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
