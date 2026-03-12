import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the current user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch the other user's profile
  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("*")
    .neq("id", user.id)
    .single();

  return (
    <AppShell profile={profile} otherProfile={otherProfile}>
      {children}
    </AppShell>
  );
}
