
import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="rounded-3xl bg-white p-10 shadow-sm border border-slate-200">
        <h1 className="text-3xl font-semibold tracking-tight">Family Dues Tracker</h1>
        <p className="text-slate-600 max-w-2xl mt-2">
          A secure, modern way for family members to view their contribution history. Admins can manage records and approvals.
        </p>
        <div className="flex gap-3 mt-6">
          <Link className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700" href="/login">Login</Link>
          <Link className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50" href="/register">Create account</Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="font-medium">Private by default</p>
            <p className="text-sm text-slate-600">Members can only see their own contributions (database-enforced).</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="font-medium">Admin approvals</p>
            <p className="text-sm text-slate-600">Self-registration is allowed, but admins approve and link accounts to records.</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="font-medium">Live updates</p>
            <p className="text-sm text-slate-600">Dashboards refresh automatically when contributions change.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
