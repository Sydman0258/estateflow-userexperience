import { PaymentMethod, PaymentStatus } from "@/lib/payments";

const STATUS_STYLES: Record<PaymentStatus, string> = {
  COMPLETED: "bg-teal-50 text-teal-800 border-teal-200",
  PENDING: "bg-amber-50 text-amber-800 border-amber-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
  REFUNDED: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

export function StatusBadge({ status, label }: { status: PaymentStatus; label?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[status]}`}
    >
      <span
        aria-hidden
        className={`w-1.5 h-1.5 rounded-full ${
          status === "COMPLETED" ? "bg-teal-600" : status === "PENDING" ? "bg-amber-500" : status === "FAILED" ? "bg-red-500" : "bg-slate-400"
        }`}
      />
      {label ?? status}
    </span>
  );
}

export function MethodMark({ method, size = "md" }: { method: PaymentMethod | ""; size?: "sm" | "md" }) {
  const box = size === "sm" ? "w-8 h-8 text-[10px]" : "w-11 h-11 text-xs";
  if (method === "ESEWA") {
    return (
      <span aria-hidden className={`${box} rounded-xl bg-[#60bb46] text-white font-extrabold flex items-center justify-center tracking-tight`}>
        eSewa
      </span>
    );
  }
  return (
    <span aria-hidden className={`${box} rounded-xl bg-slate-900 text-white flex items-center justify-center`}>
      <svg viewBox="0 0 24 24" className="w-1/2 h-1/2" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
        <path d="M2.5 10h19" />
        <path d="M6 15h4" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Notice({
  kind = "info",
  children,
}: {
  kind?: "info" | "error" | "success" | "warning";
  children: React.ReactNode;
}) {
  const styles = {
    info: "bg-sky-50 border-sky-100 text-sky-900",
    error: "bg-red-50 border-red-100 text-red-700",
    success: "bg-teal-50 border-teal-100 text-teal-800",
    warning: "bg-amber-50 border-amber-100 text-amber-900",
  }[kind];
  return (
    <div role={kind === "error" ? "alert" : "status"} aria-live={kind === "error" ? "assertive" : "polite"} className={`text-sm p-3.5 rounded-xl border ${styles}`}>
      {children}
    </div>
  );
}

export function Spinner({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function SandboxBanner() {
  return (
    <div className="flex items-start gap-3 text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3">
      <span aria-hidden className="mt-0.5">🧪</span>
      <p>
        <strong className="font-semibold">Sandbox mode.</strong> This is a test environment. No real money moves and real
        card numbers are never accepted.
      </p>
    </div>
  );
}

export function SecureNote() {
  return (
    <p className="flex items-center gap-2 text-xs text-slate-500">
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-teal-700 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="4" y="10" width="16" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
      Amounts are set by our server and every payment is verified before it is marked paid.
    </p>
  );
}

export function PageShell({
  title,
  subtitle,
  children,
  narrow = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  narrow?: boolean;
}) {
  return (
    <div className={`${narrow ? "max-w-2xl" : "max-w-5xl"} mx-auto px-5 sm:px-8 py-10 sm:py-12`}>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
      {subtitle && <p className="text-slate-500 text-sm mt-1.5">{subtitle}</p>}
      <div className="mt-7">{children}</div>
    </div>
  );
}
