import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OpenedCapsulesList } from "./opened-capsules-list";
import type { CapsuleWithProfiles } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OpenedCapsulesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: capsules } = await supabase
    .from("memory_capsules")
    .select(
      "*, author:profiles!memory_capsules_author_id_fkey(*), recipient:profiles!memory_capsules_recipient_id_fkey(*)",
    )
    .eq("recipient_id", user.id)
    .not("opened_at", "is", null)
    .order("opened_at", { ascending: false });

  return (
    <OpenedCapsulesList capsules={(capsules as CapsuleWithProfiles[]) ?? []} />
  );
}
