import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LockedCapsulesList } from "./locked-capsules-list";
import type { CapsuleWithProfiles } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LockedCapsulesPage() {
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
    .is("opened_at", null)
    .neq("trigger_type", "bad_day")
    .order("created_at", { ascending: false });

  return (
    <LockedCapsulesList capsules={(capsules as CapsuleWithProfiles[]) ?? []} />
  );
}
