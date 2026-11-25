"use client";

import Header from "@/components/Header";
import { MethodMark, Notice, PageShell, SandboxBanner, SecureNote, Spinner } from "@/components/payments/ui";
import { API_BASE, Property } from "@/lib/api";
import {
  createPayment, formatNPR, getMethods, getQuote, MethodsInfo, PaymentMethod, PaymentType, submitEsewaForm,
} from "@/lib/payments";
import { useAuthGuard } from "@/lib/useAuthGuard";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

const PREF_KEY = "estateflow_pref_method";
const STEPS = ["Payment", "Method", "Review"];

const TYPES: { id: PaymentType; title: string; text: string }[] = [
  { id: "RENT", title: "Monthly rent", text: "Pay one month of rent." },
  { id: "DEPOSIT", title: "Security deposit", text: "Refundable deposit, equal to one month's rent." },
];

async function loadProperties(): Promise<Property[]> {
  const res = await fetch(`${API_BASE}/properties/`, { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load properties.");
  const data = await res.json();
  return Array.isArray(data) ? data : data.results ?? [];
}

function NewPaymentContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { ready, user } = useAuthGuard();

  const [step, setStep] = useState(0);
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [type, setType] = useState<PaymentType>("RENT");
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [info, setInfo] = useState<MethodsInfo | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [redirecting, setRedirecting] = useState("");

  useEffect(() => {
    if (!ready) return;
    loadProperties()
      .then((list) => {
        setProperties(list);
        const wanted = Number(params.get("property"));
        if (wanted && list.some((p) => p.id === wanted)) setPropertyId(wanted);
      })
      .catch(() => setError("We couldn't load the property list. Is the server running?"));
    getMethods()
      .then((m) => {
        setInfo(m);
        const saved = localStorage.getItem(PREF_KEY) as PaymentMethod | null;
        if (saved && m.methods.some((x) => x.id === saved && x.available)) setMethod(saved);
      })
      .catch(() => undefined);
  }, [ready, params]);

  // Server-calculated amount: shown to the user, but never sent back by the client.
  useEffect(() => {
    if (!propertyId) {
      setAmount(null);
      return;
    }
    let cancelled = false;
    getQuote(propertyId, type)
      .then((q) => !cancelled && (setAmount(q.amount), setError("")))
      .catch((e: Error) => !cancelled && (setAmount(null), setError(e.message)));
    return () => {
      cancelled = true;
    };
  }, [propertyId, type]);

  const property = useMemo(() => properties?.find((p) => p.id === propertyId) ?? null, [properties, propertyId]);
  const canNext = step === 0 ? !!property && amount !== null : step === 1 ? !!method : true;

  async function pay() {
    if (!property || !method) return;
    setPaying(true);
    setError("");
    try {
      localStorage.setItem(PREF_KEY, method);
      const { checkout } = await createPayment({ property_id: property.id, payment_type: type, method });
      if (checkout.type === "esewa") {
        setRedirecting("Taking you to eSewa…");
        submitEsewaForm(checkout);
      } else {
        setRedirecting("Opening secure card checkout…");
        router.push(checkout.path);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not start the payment.");
      setPaying(false);
    }
  }

  if (user && user.role !== "TENANT") {
    return (
      <PageShell title="Payments" narrow>
        <Notice kind="warning">Only tenant accounts can make payments. Landlords can see received payments under Payments.</Notice>
      </PageShell>
    );
  }

  return (
    <PageShell title="Make a payment" subtitle="Pay rent or a deposit securely. You'll get a receipt straight away.">
      {redirecting && (
        <div className="fixed inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-slate-700" role="status">
          <Spinner className="w-8 h-8 text-teal-700" />
          <p className="font-medium">{redirecting}</p>
          <p className="text-sm text-slate-500">Please don&apos;t close this tab.</p>
        </div>
      )}

      {info?.sandbox && <div className="mb-6"><SandboxBanner /></div>}

      <ol className="flex items-center gap-2 mb-8" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2 flex-1 last:flex-none">
            <button
              type="button"
              disabled={i > step}
              onClick={() => setStep(i)}
              aria-current={i === step ? "step" : undefined}
              className="flex items-center gap-2 disabled:cursor-default"
            >
              <span
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                  i < step ? "bg-teal-700 text-white" : i === step ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </span>
              <span className={`text-sm font-medium hidden sm:block ${i === step ? "text-slate-900" : "text-slate-500"}`}>{label}</span>
            </button>
            {i < STEPS.length - 1 && <span className={`h-px flex-1 ${i < step ? "bg-teal-700" : "bg-slate-200"}`} aria-hidden />}
          </li>
        ))}
      </ol>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-7 space-y-6">
          {error && <Notice kind="error">{error}</Notice>}

          {step === 0 && (
            <>
              <div>
                <label htmlFor="property" className="block text-sm font-semibold text-slate-800 mb-2">Property</label>
                {!properties ? (
                  <div className="h-11 rounded-xl bg-slate-100 animate-pulse" />
                ) : properties.length === 0 ? (
                  <Notice kind="warning">
                    There are no listings yet. (Developers: run <code className="font-mono">python manage.py seed_demo</code>.)
                  </Notice>
                ) : (
                  <select
                    id="property"
                    value={propertyId ?? ""}
                    onChange={(e) => setPropertyId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  >
                    <option value="">Select a property…</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} – {p.price_display}</option>
                    ))}
                  </select>
                )}
              </div>

              <fieldset>
                <legend className="block text-sm font-semibold text-slate-800 mb-2">What are you paying?</legend>
                <div className="grid sm:grid-cols-2 gap-3">
                  {TYPES.map((t) => (
                    <label
                      key={t.id}
                      className={`cursor-pointer rounded-xl border p-4 transition-all ${
                        type === t.id ? "border-teal-600 bg-teal-50/60 ring-2 ring-teal-600/20" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input type="radio" name="type" className="sr-only" checked={type === t.id} onChange={() => setType(t.id)} />
                      <span className="block font-semibold text-slate-900">{t.title}</span>
                      <span className="block text-sm text-slate-500 mt-0.5">{t.text}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          {step === 1 && (
            <fieldset>
              <legend className="block text-sm font-semibold text-slate-800 mb-3">Choose how to pay</legend>
              <div className="space-y-3">
                {(info?.methods ?? []).map((m) => (
                  <label
                    key={m.id}
                    className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                      !m.available ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    } ${method === m.id ? "border-teal-600 bg-teal-50/60 ring-2 ring-teal-600/20" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <input
                      type="radio"
                      name="method"
                      className="sr-only"
                      disabled={!m.available}
                      checked={method === m.id}
                      onChange={() => setMethod(m.id)}
                    />
                    <MethodMark method={m.id} />
                    <span className="flex-1">
                      <span className="block font-semibold text-slate-900">{m.label}</span>
                      <span className="block text-sm text-slate-500">{m.available ? m.description : "Not available right now"}</span>
                    </span>
                    <span aria-hidden className={`w-5 h-5 rounded-full border-2 ${method === m.id ? "border-teal-600 bg-teal-600 shadow-[inset_0_0_0_3px_white]" : "border-slate-300"}`} />
                  </label>
                ))}
                {!info && <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />}
              </div>

              {info?.sandbox && method === "ESEWA" && info.esewa_test && (
                <div className="mt-4 text-sm bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700">
                  <p className="font-semibold mb-1">eSewa test account</p>
                  <p>ID: <code className="font-mono">{info.esewa_test.ids[0]}</code> · Password: <code className="font-mono">{info.esewa_test.password}</code></p>
                  <p>MPIN: <code className="font-mono">{info.esewa_test.mpin}</code> · OTP/token: <code className="font-mono">{info.esewa_test.otp}</code></p>
                </div>
              )}
            </fieldset>
          )}

          {step === 2 && property && method && amount !== null && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Review your payment</h2>
              <dl className="divide-y divide-slate-100 text-sm">
                {[
                  ["Property", property.name],
                  ["Payment", TYPES.find((t) => t.id === type)?.title ?? type],
                  ["Method", method === "ESEWA" ? "eSewa" : "Credit / debit card"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-3">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="font-medium text-slate-900 text-right">{v}</dd>
                  </div>
                ))}
                <div className="flex justify-between py-4">
                  <dt className="font-semibold text-slate-900">Total</dt>
                  <dd className="text-xl font-bold text-slate-900">{formatNPR(amount)}</dd>
                </div>
              </dl>
              <SecureNote />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {step > 0 ? (
              <button type="button" onClick={() => setStep(step - 1)} disabled={paying} className="text-sm font-medium text-slate-600 hover:text-slate-900">
                ← Back
              </button>
            ) : (
              <Link href="/tenant/payments" className="text-sm font-medium text-slate-600 hover:text-slate-900">Cancel</Link>
            )}
            {step < 2 ? (
              <button
                type="button"
                disabled={!canNext}
                onClick={() => { setError(""); setStep(step + 1); }}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold disabled:opacity-40 transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={pay}
                disabled={paying}
                className="px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold disabled:opacity-60 transition-colors inline-flex items-center gap-2"
              >
                {paying && <Spinner className="w-4 h-4" />}
                {paying ? "Starting…" : `Pay ${formatNPR(amount)}`}
              </button>
            )}
          </div>
        </section>

        <aside className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Summary</h2>
          {property ? (
            <>
              <p className="font-semibold text-slate-900">{property.name}</p>
              <p className="text-sm text-slate-500">{property.location}</p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-sm text-slate-500">{type === "RENT" ? "Monthly rent" : "Deposit"}</span>
                <span className="text-lg font-bold text-slate-900">{formatNPR(amount)}</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">Pick a property to see the total.</p>
          )}
        </aside>
      </div>
    </PageShell>
  );
}

export default function NewPaymentPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      <Suspense fallback={<div className="max-w-2xl mx-auto py-16 text-center text-slate-500">Loading…</div>}>
        <NewPaymentContent />
      </Suspense>
    </div>
  );
}
