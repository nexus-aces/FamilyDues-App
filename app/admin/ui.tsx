
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

type LinkRequest = {
  id: string;
  user_id: string;
  requested_name: string | null;
  note: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

type Member = { id: string; member_name: string };

export default function AdminClient({ userId, role }: { userId: string; role: string }) {
  const supabase = createClient();
  const isAdmin = role === "admin";

  const [requests, setRequests] = useState<LinkRequest[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberByReq, setSelectedMemberByReq] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  // Add contribution
  const [memberId, setMemberId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [datePaid, setDatePaid] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");

  async function load() {
    setLoading(true);
    const [reqRes, memRes] = await Promise.all([
      supabase.from("link_requests").select("id,user_id,requested_name,note,status,created_at").order("created_at", { ascending: false }),
      supabase.from("members").select("id,member_name").order("member_name", { ascending: true }),
    ]);
    setRequests((reqRes.data as any) ?? []);
    setMembers((memRes.data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (!isAdmin) return;
    load();
    const channel = supabase
      .channel("realtime:admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "link_requests" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "members" }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function approve(req: LinkRequest) {
    setMsg(null);
    const member_id = selectedMemberByReq[req.id];
    if (!member_id) return setMsg("Select a member to link before approving.");

    const { error: linkErr } = await supabase.from("member_links").insert({
      user_id: req.user_id,
      member_id,
      approved_by: userId,
    });
    if (linkErr) return setMsg(linkErr.message);

    const { error: reqErr } = await supabase
      .from("link_requests")
      .update({ status: "approved", decided_at: new Date().toISOString(), decided_by: userId })
      .eq("id", req.id);
    if (reqErr) return setMsg(reqErr.message);

    setMsg("Approved and linked successfully.");
    load();
  }

  async function reject(req: LinkRequest) {
    setMsg(null);
    const { error } = await supabase
      .from("link_requests")
      .update({ status: "rejected", decided_at: new Date().toISOString(), decided_by: userId })
      .eq("id", req.id);
    if (error) setMsg(error.message);
    else setMsg("Rejected.");
    load();
  }

  async function addContribution(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!memberId) return setMsg("Select a member.");
    const amt = Number(amount);
    if (!amt || amt <= 0) return setMsg("Enter a valid amount.");
    if (!datePaid) return setMsg("Select a payment date.");

    const dt = new Date(datePaid);
    const { error } = await supabase.from("contributions").insert({
      member_id: memberId,
      amount: amt,
      date_paid: dt.toISOString().slice(0, 10),
      month: dt.getMonth() + 1,
      year: dt.getFullYear(),
      payment_method: paymentMethod || null,
      remarks: remarks || null,
      created_by: userId,
    });

    if (error) return setMsg(error.message);

    setAmount("");
    setDatePaid("");
    setPaymentMethod("");
    setRemarks("");
    setMsg("Contribution added.");
  }

  if (!isAdmin) {
    return (
      <AppShell isAdmin={false}>
        <Card>
          <h1 className="text-xl font-semibold">Admin</h1>
          <p className="text-sm text-slate-600 mt-1">You do not have admin access.</p>
        </Card>
      </AppShell>
    );
  }

  const pending = requests.filter((r) => r.status === "pending");

  return (
    <AppShell isAdmin={true}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-slate-600">Approve members and add contributions.</p>
        </div>

        {msg && <Card><p className="text-sm">{msg}</p></Card>}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Approvals</h2>
              {loading && <span className="text-sm text-slate-500">Loading...</span>}
            </div>
            <div className="mt-4 space-y-3">
              {pending.map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{r.requested_name ?? "(no name)"}</p>
                      {r.note && <p className="text-sm text-slate-600 mt-1">Note: {r.note}</p>}
                      <p className="text-xs text-slate-500 mt-2">User ID: {r.user_id}</p>
                    </div>
                    <Badge variant="warning">Pending</Badge>
                  </div>

                  <div className="mt-3 flex flex-col gap-2">
                    <label className="text-sm font-medium">Link to member record</label>
                    <select
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                      value={selectedMemberByReq[r.id] ?? ""}
                      onChange={(e) => setSelectedMemberByReq({ ...selectedMemberByReq, [r.id]: e.target.value })}
                    >
                      <option value="">Select member…</option>
                      {members.map((m) => (<option key={m.id} value={m.id}>{m.member_name}</option>))}
                    </select>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => approve(r)}>Approve</Button>
                      <Button className="bg-slate-900 hover:bg-slate-800" onClick={() => reject(r)}>Reject</Button>
                    </div>
                  </div>
                </div>
              ))}
              {!pending.length && <p className="text-sm text-slate-500">No pending requests.</p>}
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold">Add Contribution</h2>
            <p className="text-sm text-slate-600 mt-1">Record a payment (members see it instantly).</p>

            <form className="mt-4 space-y-3" onSubmit={addContribution}>
              <div>
                <label className="text-sm font-medium">Member</label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                >
                  <option value="">Select member…</option>
                  {members.map((m) => (<option key={m.id} value={m.id}>{m.member_name}</option>))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Amount</label>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="e.g., 150" />
              </div>
              <div>
                <label className="text-sm font-medium">Date paid</label>
                <Input value={datePaid} onChange={(e) => setDatePaid(e.target.value)} type="date" />
              </div>
              <div>
                <label className="text-sm font-medium">Payment method (optional)</label>
                <Input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Remarks (optional)</label>
                <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              </div>
              <Button className="w-full">Add</Button>
            </form>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
