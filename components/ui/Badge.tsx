
import { clsx } from "clsx";

export function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "warning" | "success" }) {
  const styles = {
    default: "bg-slate-100 text-slate-700",
    warning: "bg-amber-100 text-amber-800",
    success: "bg-emerald-100 text-emerald-800",
  };
  return <span className={clsx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", styles[variant])}>{children}</span>;
}
