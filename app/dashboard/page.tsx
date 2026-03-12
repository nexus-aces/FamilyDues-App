
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./ui";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  const { data: link } = await supabase.from("member_links").select("member_id").eq("user_id", user.id).maybeSingle();

  return (
    <DashboardClient
      fullName={profile?.full_name ?? user.email ?? ""}
      role={profile?.role ?? "member"}
      memberId={link?.member_id ?? null}
    />
  );
}
