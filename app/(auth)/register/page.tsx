
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RegisterPage() {
  const supabase = createClient();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      setLoading(false);
      return setError(error.message);
    }

    const userId = data.user?.id;
    if (userId) {
      const { error: reqErr } = await supabase.from("link_requests").insert({
        user_id: userId,
        requested_name: fullName,
        note,
      });
      if (reqErr) {
        setLoading(false);
        return setError(reqErr.message);
      }
    }

    setLoading(false);
    router.push("/dashboard");
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Create account</h1>
        <p className="text-sm text-slate-600 mt-1">Self-registration is allowed. Admin approval is required.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div>
            <label className="text-sm font-medium">Full name (as in records)</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={8} />
            <p className="text-xs text-slate-500 mt-1">Minimum 8 characters recommended.</p>
          </div>
          <div>
            <label className="text-sm font-medium">Note to admin (optional)</label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g., phone number for verification" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button disabled={loading} className="w-full">{loading ? "Creating..." : "Create account"}</Button>
        </form>

        <p className="text-sm text-slate-600 mt-4">Already have an account? <Link href="/login">Login</Link></p>
      </div>
    </main>
  );
}
