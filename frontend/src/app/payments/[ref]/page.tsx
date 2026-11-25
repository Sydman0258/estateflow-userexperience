"use client";

import Header from "@/components/Header";
import { MethodMark, Notice, PageShell, Spinner, StatusBadge } from "@/components/payments/ui";
import {
  cancelPayment, formatDate, formatDateTime, formatNPR, getPayment, PaymentDetail, resumePayment, submitEsewaForm,
} from "@/lib/payments";
import { useAuthGuard } from "@/lib/useAuthGuard";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

const EVENT_LABELS: Record<string, string> = {
  created: "Payment started",
  completed: "Payment confirmed",
  failed: "Payment failed",
  cancelled: "Payment cancelled",
  expired: "Payment window expired",
  superseded: "Replaced by a newer attempt",
  card_declined: "Card was declined",
  verification_failed: "Verification did not pass",
};

function Receipt() {
  const { ref } = useParams<{ ref: string }>();
  const router = useRouter();
  const params = useSearchParams();
  const { ready, user } = useAuthGuard();
  const [p, setP] = useState<PaymentDetail | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    getPayment(ref).then(setP).catch((e: Error) => setError(e.message));
  }, [ref]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  async function resume() {
    setBusy(true);
    try {
      const { checkout } = await resumePayment(ref);
      if (checkout.type === "esewa") submitEsewaForm(checkout);
      else router.push(checkout.path);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not resume the payment.");
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    try {
      await cancelPayment(ref);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not cancel.");
    } finally {
      setBusy(false);
    }
  }

  if (error && !p) {
    return (
      <PageShell title="Payment" narrow>
        <Notice kind="error">{error}</Notice>
        <p className="mt-4"><Link href="/tenant/payments" className="text-teal-700 font-semibold text-sm">← Back to payments</Link></p>
      </PageShell>
    );
  }
  if (!p) {
    return <PageShell title="Payment" narrow><div className="h-72 rounded-2xl bg-slate-100 animate-pulse" /></PageShell>;
  }

  const isTenant = user?.role === "TENANT";
  const back = isTenant ? "/tenant/payments" : "/landlord/payments";
  const heading =
    p.status === "COMPLETED" ? (params.get("paid") ? "Payment successful" : "Payment receipt")
    : p.status === "PENDING" ? "Payment pending"
    : p.status === "FAILED" ? "Payment failed" : "Payment " + p.status_label.toLowerCase();

  return (
    <PageShell title={heading} subtitle={`Reference ${p.reference}`} narrow>
      {error && <div className="mb-4"><Notice kind="error">{error}</Notice></div>}

      <article className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden print:shadow-none print:border-slate-300">
        <div className={`px-6 py-6 flex items-center justify-between gap-4 ${p.status === "COMPLETED" ? "bg-teal-50" : "bg-slate-50"}`}>
          <div>
            <p className="text-sm text-slate-500">Amount</p>
            <p className="text-3xl font-bold text-slate-900">{formatNPR(p.amount)}</p>
          </div>
          <StatusBadge status={p.status} label={p.status_label} />
        </div>

        <dl className="px-6 py-2 divide-y divide-slate-100 text-sm">
          {([
            ["Property", `${p.property_name}`],
            ["Location", p.property_location || "–"],
            ["Payment for", p.payment_type_label],
            ["Billing period", p.period_start ? `${formatDate(p.period_start)} – ${formatDate(p.period_end)}` : "–"],
            ["Tenant", p.tenant_name],
            ["Landlord", p.landlord_name],
            ["Paid with", p.method === "CARD" && p.card_last4 ? `${p.card_brand} •••• ${p.card_last4}` : p.method_label || "–"],
            ["Date", formatDateTime(p.completed_at ?? p.created_at)],
            ...(p.external_reference ? [["Gateway reference", p.external_reference]] : []),
            ...(p.failure_reason ? [["Reason", p.failure_reason]] : []),
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-6 py-3">
              <dt className="text-slate-500">{k}</dt>
              <dd className="font-medium text-slate-900 text-right break-words">{v}</dd>
            </div>
          ))}
        </dl>
      </article>

      <div className="flex flex-wrap gap-3 mt-6 print:hidden">
        {p.status === "PENDING" && isTenant && (
          <>
            <button onClick={resume} disabled={busy} className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold disabled:opacity-60 inline-flex items-center gap-2">
              {busy && <Spinner className="w-4 h-4" />} Continue payment
            </button>
            <button onClick={cancel} disabled={busy} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:border-red-300 hover:text-red-600">
              Cancel payment
            </button>
          </>
        )}
        {p.status === "COMPLETED" && (
          <button onClick={() => window.print()} className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold">
            Print / save as PDF
          </button>
        )}
        {(p.status === "FAILED" || p.status === "CANCELLED") && isTenant && (
          <Link href={`/tenant/payments/new?property=${p.property_id}`} className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold">
            Try again
          </Link>
        )}
        <Link href={back} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:border-slate-300">
          All payments
        </Link>
      </div>

      {p.events.length > 0 && (
        <section className="mt-10 print:hidden" aria-labelledby="timeline">
          <h2 id="timeline" className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Activity</h2>
          <ol className="relative border-l border-slate-200 ml-2 space-y-5">
            {p.events.map((e, i) => (
              <li key={i} className="ml-5">
                <span className="absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 ring-4 ring-[#fafafa]" aria-hidden />
                <p className="text-sm font-medium text-slate-800">{EVENT_LABELS[e.event] ?? e.event}</p>
                <p className="text-xs text-slate-500">{formatDateTime(e.created_at)}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </PageShell>
  );
}

export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="print:hidden"><Header /></div>
      <Suspense fallback={null}>
        <Receipt />
      </Suspense>
    </div>
  );
}
