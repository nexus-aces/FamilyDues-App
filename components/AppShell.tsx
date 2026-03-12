
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/Button";
import { Home, Shield, LogOut } from "lucide-react";
import { clsx } from "clsx";

export function AppShell({ children, isAdmin }: { children: React.ReactNode; isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const nav = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="font-semibold">Family Dues Tracker</Link>
          <Button onClick={logout} className="bg-slate-900 hover:bg-slate-800">
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-6 grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 h-fit">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm",
                    active ? "bg-brand-50 text-brand-700" : "hover:bg-slate-50"
                  )}
                >
                  <Icon className="h-4 w-4" /> {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <section>{children}</section>
      </div>
    </div>
  );
}
