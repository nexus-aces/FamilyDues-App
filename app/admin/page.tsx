
import { createClient } from "@/lib/supabase/server";
import AdminClient from "./ui";

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  return <AdminClient userId={user.id} role={profile?.role ?? "member"} />;
}
