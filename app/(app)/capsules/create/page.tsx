import { redirect } from "next/navigation";
import { CreateCapsuleForm } from "@/components/create-capsule-form";
import { getPartnerProfile } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export default async function CreateCapsulePage() {
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

  return (
    <CreateCapsuleForm
      recipientName={
        otherProfile?.display_name ?? partnerProfile?.displayName ?? ""
      }
    />
  );
}
