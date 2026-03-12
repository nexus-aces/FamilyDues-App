import { Suspense } from "react";
import LoginInner from "./LoginInner";

function LoginSkeleton() {
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-40 bg-slate-100 rounded mt-3 animate-pulse" />
        <div className="mt-6 space-y-3">
          <div className="h-10 w-full bg-slate-100 rounded animate-pulse" />
          <div className="h-10 w-full bg-slate-100 rounded animate-pulse" />
          <div className="h-10 w-full bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginInner />
    </Suspense>
  );
}