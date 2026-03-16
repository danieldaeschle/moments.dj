import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { EditMomentForm } from "./form";
import type { MomentWithAuthor } from "@/lib/types";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditMomentPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: moment } = await supabase
    .from("moments")
    .select("*, profiles!moments_author_id_fkey(*)")
    .eq("id", id)
    .single();

  if (!moment) {
    notFound();
  }

  if (moment.author_id !== user.id) {
    redirect("/");
  }

  return <EditMomentForm moment={moment as MomentWithAuthor} />;
}
