
"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Contribution = {
  id: string;
  amount: number;
  date_paid: string;
  month: number;
  year: number;
  payment_method: string | null;
  remarks: string | null;
};

export default function DashboardClient({ fullName, role, memberId }: { fullName: string; role: string; memberId: string | null }) {
  const supabase = createClient();
  const isAdmin = role === "admin";

  const [loading, setLoading] = useState(true);
  const [contrib, setContrib] = useState<Contribution[]>([]);
  const [yearFilter, setYearFilter] = useState<number | "all">("all");

  async function load() {
    if (!memberId) {
      setContrib([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("contributions")
      .select("id, amount, date_paid, month, year, payment_method, remarks")
      .eq("member_id", memberId)
      .order("date_paid", { ascending: false });

    setContrib((data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    if (!memberId) return;

    const channel = supabase
      .channel("realtime:contributions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contributions", filter: `member_id=eq.${memberId}` },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  const years = useMemo(() => Array.from(new Set(contrib.map((c) => c.year))).sort((a, b) => b - a), [contrib]);
  const filtered = useMemo(() => (yearFilter === "all" ? contrib : contrib.filter((c) => c.year === yearFilter)), [contrib, yearFilter]);

  const totals = useMemo(() => {
    const lifetime = contrib.reduce((s, c) => s + Number(c.amount || 0), 0);
    const thisYear = new Date().getFullYear();
    const yearTotal = contrib.filter((c) => c.year === thisYear).reduce((s, c) => s + Number(c.amount || 0), 0);
    return { lifetime, yearTotal, thisYear };
  }, [contrib]);

  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of filtered) {
      const key = `${c.year}-${String(c.month).padStart(2, "0")}`;
      map.set(key, (map.get(key) || 0) + Number(c.amount || 0));
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([period, amount]) => ({ period, amount }));
  }, [filtered]);

  return (
    <AppShell isAdmin={isAdmin}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Welcome, {fullName || "Member"}</h1>
            <p className="text-sm text-slate-600">Your contribution history (auto-updates when changes are made).</p>
          </div>
          <Badge variant={memberId ? "success" : "warning"}>{memberId ? "Approved" : "Pending approval"}</Badge>
        </div>

        {!memberId ? (
          <Card>
            <h2 className="font-semibold">Pending approval</h2>
            <p className="text-sm text-slate-600 mt-1">An admin will approve and link your account to your records.</p>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <p className="text-sm text-slate-600">Lifetime total</p>
                <p className="text-2xl font-semibold mt-1">{totals.lifetime.toFixed(2)}</p>
              </Card>
              <Card>
                <p className="text-sm text-slate-600">{totals.thisYear} total</p>
                <p className="text-2xl font-semibold mt-1">{totals.yearTotal.toFixed(2)}</p>
              </Card>
              <Card>
                <p className="text-sm text-slate-600">Entries</p>
                <p className="text-2xl font-semibold mt-1">{contrib.length}</p>
              </Card>
            </div>

            <Card>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">Trends</h2>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-600">Year:</span>
                  <select
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                  >
                    <option value="all">All</option>
                    {years.map((y) => (<option key={y} value={y}>{y}</option>))}
                  </select>
                </div>
              </div>

              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="period" hide />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-slate-500 mt-2">Aggregated by month (period = YYYY-MM).</p>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Contributions</h2>
                {loading && <span className="text-sm text-slate-500">Loading...</span>}
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-600">
                      <th className="py-2">Date</th>
                      <th className="py-2">Amount</th>
                      <th className="py-2">Method</th>
                      <th className="py-2">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr key={c.id} className="border-t border-slate-100">
                        <td className="py-2 whitespace-nowrap">{format(new Date(c.date_paid), "dd MMM yyyy")}</td>
                        <td className="py-2 font-medium">{Number(c.amount).toFixed(2)}</td>
                        <td className="py-2">{c.payment_method ?? "—"}</td>
                        <td className="py-2">{c.remarks ?? "—"}</td>
                      </tr>
                    ))}
                    {!filtered.length && (
                      <tr><td colSpan={4} className="py-6 text-center text-slate-500">No contributions found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
