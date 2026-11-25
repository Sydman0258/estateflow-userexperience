"use client";

import Header from "@/components/Header";
import { MethodMark, Notice, PageShell, StatusBadge } from "@/components/payments/ui";
import { formatDate, formatNPR, listPayments, Payment, PaymentList, PaymentStatus } from "@/lib/payments";
import { useAuthGuard } from "@/lib/useAuthGuard";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const FILTERS: { id: "ALL" | PaymentStatus; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "COMPLETED", label: "Paid" },
  { id: "PENDING", label: "Pending" },
  { id: "FAILED", label: "Failed" },
  { id: "CANCELLED", label: "Cancelled" },
];

export default function PaymentsOverview({ role }: { role: "TENANT" | "LANDLORD" }) {
  const { ready, user } = useAuthGuard();
  const [data, setData] = useState<PaymentList | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"ALL" | PaymentStatus>("ALL");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!ready) return;
    listPayments().then(setData).catch((e: Error) => setError(e.message));
  }, [ready]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data?.results ?? []).filter(
      (p) =>
        (filter === "ALL" || p.status === filter) &&
        (!term || `${p.property_name} ${p.reference} ${p.tenant_name}`.toLowerCase().includes(term))
    );
  }, [data, filter, q]);

  const tenant = role === "TENANT";
  const wrongRole = user && user.role !== role && user.role !== "ADMIN";

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      <PageShell
        title={tenant ? "Payments" : "Payments received"}
        subtitle={tenant ? "Your rent and deposit payments, with receipts." : "Payments tenants have made for your properties."}
      >
        {wrongRole && <div className="mb-6"><Notice kind="warning">This page is for {tenant ? "tenant" : "landlord"} accounts.</Notice></div>}
        {error && <div className="mb-6"><Notice kind="error">{error}</Notice></div>}

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            [tenant ? "Total paid" : "Total received", data ? formatNPR(data.summary.paid_total) : null],
            ["Pending", data ? formatNPR(data.summary.pending_total) : null],
            ["Transactions", data ? String(data.summary.count) : null],
          ].map(([label, value]) => (
            <div key={label as string} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-sm text-slate-500">{label}</p>
              {value === null ? <div className="h-8 w-28 mt-1 rounded bg-slate-100 animate-pulse" /> : <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  filter === f.id ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <label className="sr-only" htmlFor="pay-search">Search payments</label>
            <input id="pay-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
              className="border border-slate-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 w-full sm:w-52" />
            {tenant && (
              <Link href="/tenant/payments/new" className="shrink-0 px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold whitespace-nowrap">
                Make a payment
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {!data && !error && [0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse bg-slate-50/60" />)}

          {data && rows.length === 0 && (
            <div className="py-16 px-6 text-center">
              <p className="font-semibold text-slate-900">{data.results.length === 0 ? "No payments yet" : "No payments match"}</p>
              <p className="text-sm text-slate-500 mt-1">
                {data.results.length === 0
                  ? tenant ? "When you pay rent or a deposit it will show up here." : "Payments from your tenants will show up here."
                  : "Try a different filter or search."}
              </p>
              {tenant && data.results.length === 0 && (
                <Link href="/tenant/payments/new" className="inline-block mt-5 px-5 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold">Make your first payment</Link>
              )}
            </div>
          )}

          {rows.map((p: Payment) => (
            <Link key={p.reference} href={`/payments/${p.reference}`} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
              <MethodMark method={p.method} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{p.property_name}</p>
                <p className="text-xs text-slate-500 truncate">
                  {p.payment_type_label} · {tenant ? p.method_label : p.tenant_name} · {formatDate(p.completed_at ?? p.created_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900">{formatNPR(p.amount)}</p>
                <div className="mt-1"><StatusBadge status={p.status} label={p.status_label} /></div>
              </div>
            </Link>
          ))}
        </div>
      </PageShell>
    </div>
  );
}
