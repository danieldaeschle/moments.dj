import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Timeline } from "@/components/timeline";
import type { MomentWithAuthor } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: moments } = await supabase
    .from("moments")
    .select("*, profiles(*)")
    .order("moment_date", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <Timeline
      moments={(moments as MomentWithAuthor[]) ?? []}
      currentUserId={user.id}
    />
  );
}
