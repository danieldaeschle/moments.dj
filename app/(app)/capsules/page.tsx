import { createClient } from "@/lib/supabase/server";
import { getPartnerProfile } from "@/lib/constants";
import { redirect } from "next/navigation";
import { CapsulesList } from "@/components/capsules-list";
import type { CapsuleWithProfiles } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CapsulesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const partnerProfile = getPartnerProfile(user.email);

  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .ilike("email", partnerProfile?.email ?? "")
    .maybeSingle();

  const { data: capsules } = await supabase
    .from("memory_capsules")
    .select(
      "*, author:profiles!memory_capsules_author_id_fkey(*), recipient:profiles!memory_capsules_recipient_id_fkey(*)",
    )
    .order("created_at", { ascending: false });

  return (
    <CapsulesList
      capsules={(capsules as CapsuleWithProfiles[]) ?? []}
      currentUserId={user.id}
      recipientName={
        otherProfile?.display_name ?? partnerProfile?.displayName ?? ""
      }
    />
  );
}
