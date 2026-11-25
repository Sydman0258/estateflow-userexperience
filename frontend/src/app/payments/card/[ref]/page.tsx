"use client";

import Header from "@/components/Header";
import { MethodMark, Notice, PageShell, SandboxBanner, SecureNote, Spinner } from "@/components/payments/ui";
import { HttpError } from "@/lib/http";
import { chargeCard, formatNPR, getMethods, getPayment, MethodsInfo, PaymentDetail } from "@/lib/payments";
import { useAuthGuard } from "@/lib/useAuthGuard";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const digits = (v: string) => v.replace(/\D/g, "");

function luhn(num: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = Number(num[i]);
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return num.length > 0 && sum % 10 === 0;
}

function brandOf(num: string): "Visa" | "Mastercard" | "Amex" | "Card" {
  if (num.startsWith("4")) return "Visa";
  if (/^(5[1-5]|2)/.test(num)) return "Mastercard";
  if (/^3[47]/.test(num)) return "Amex";
  return "Card";
}

function formatNumber(num: string, brand: string) {
  if (brand === "Amex") return [num.slice(0, 4), num.slice(4, 10), num.slice(10, 15)].filter(Boolean).join(" ");
  return (num.match(/.{1,4}/g) ?? []).join(" ");
}

function CardCheckout() {
  const { ref } = useParams<{ ref: string }>();
  const router = useRouter();
  const { ready, user } = useAuthGuard();

  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [info, setInfo] = useState<MethodsInfo | null>(null);
  const [loadError, setLoadError] = useState("");

  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready || !ref) return;
    getPayment(ref)
      .then((p) => {
        if (p.status !== "PENDING") router.replace(`/payments/${ref}`);
        else setPayment(p);
      })
      .catch((e: Error) => setLoadError(e.message));
    getMethods().then(setInfo).catch(() => undefined);
  }, [ready, ref, router]);

  // Card data lives only in component state and is wiped when leaving the page.
  useEffect(() => () => { setNumber(""); setCvc(""); }, []);

  const num = digits(number);
  const brand = brandOf(num);
  const cvcLen = brand === "Amex" ? 4 : 3;
  const [mm, yy] = expiry.split("/");

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Enter the name on the card.";
    if (num.length < 13 || !luhn(num)) e.number = "That card number doesn't look right.";
    const month = Number(mm), year = 2000 + Number(yy);
    const now = new Date();
    if (!mm || !yy || yy.length !== 2 || month < 1 || month > 12) e.expiry = "Use MM/YY.";
    else if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) e.expiry = "This card has expired.";
    if (cvc.length !== cvcLen) e.cvc = `${cvcLen} digits.`;
    return e;
  }, [name, num, mm, yy, cvc, cvcLen]);
  const valid = Object.keys(errors).length === 0;

  function onExpiry(v: string) {
    let d = digits(v).slice(0, 4);
    if (d.length >= 3) d = `${d.slice(0, 2)}/${d.slice(2)}`;
    else if (d.length === 2 && v.endsWith("/")) d = `${d}/`;
    setExpiry(d);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, number: true, expiry: true, cvc: true });
    if (!valid || !payment) return;
    setSubmitting(true);
    setError("");
    try {
      await chargeCard(payment.reference, {
        card_number: num,
        exp_month: Number(mm),
        exp_year: 2000 + Number(yy),
        cvc,
        cardholder_name: name.trim(),
      });
      setNumber("");
      setCvc("");
      router.replace(`/payments/${payment.reference}?paid=1`);
    } catch (err: unknown) {
      setCvc("");
      if (err instanceof HttpError && (err.code === "too_many_attempts" || err.status === 409)) {
        router.replace(`/payments/${payment.reference}`);
        return;
      }
      const left = err instanceof HttpError && err.data && typeof err.data === "object" ? (err.data as { attempts_left?: number }).attempts_left : undefined;
      setError((err instanceof Error ? err.message : "Payment failed.") + (left !== undefined ? ` (${left} attempt${left === 1 ? "" : "s"} left)` : ""));
      setSubmitting(false);
    }
  }

  function fillTest(n: string) {
    setNumber(formatNumber(digits(n), brandOf(digits(n))));
    setExpiry("12/35");
    setCvc(digits(n).startsWith("37") ? "1234" : "123");
    if (!name) setName(user ? `${user.first_name} ${user.last_name}`.trim() : "Test User");
  }

  const input = (bad: boolean) =>
    `w-full border rounded-xl px-4 py-3 text-slate-900 bg-white focus:outline-none focus:ring-2 transition-colors ${
      bad ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" : "border-slate-200 focus:ring-teal-500/30 focus:border-teal-500"
    }`;
  const show = (k: string) => touched[k] && errors[k];

  if (loadError) {
    return (
      <PageShell title="Card payment" narrow>
        <Notice kind="error">{loadError}</Notice>
        <p className="mt-4"><Link href="/tenant/payments" className="text-teal-700 font-semibold text-sm">← Back to payments</Link></p>
      </PageShell>
    );
  }

  return (
    <PageShell title="Pay by card" subtitle="Secure checkout" narrow>
      {info?.sandbox && <div className="mb-6"><SandboxBanner /></div>}

      {!payment ? (
        <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <MethodMark method="CARD" />
              <div>
                <p className="font-semibold text-slate-900">{payment.property_name}</p>
                <p className="text-sm text-slate-500">{payment.payment_type_label}</p>
              </div>
            </div>
            <p className="text-xl font-bold text-slate-900">{formatNPR(payment.amount)}</p>
          </div>

          <form onSubmit={submit} noValidate className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            {error && <Notice kind="error">{error}</Notice>}

            <div>
              <label htmlFor="cc-name" className="block text-sm font-medium text-slate-700 mb-1.5">Name on card</label>
              <input id="cc-name" name="cc-name" autoComplete="cc-name" value={name} onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))} className={input(!!show("name"))}
                aria-invalid={!!show("name")} aria-describedby={show("name") ? "err-name" : undefined} />
              {show("name") && <p id="err-name" className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="cc-number" className="block text-sm font-medium text-slate-700 mb-1.5">Card number</label>
              <div className="relative">
                <input id="cc-number" name="cc-number" inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456"
                  value={number} onChange={(e) => { const d = digits(e.target.value).slice(0, brandOf(digits(e.target.value)) === "Amex" ? 15 : 16); setNumber(formatNumber(d, brandOf(d))); }}
                  onBlur={() => setTouched((t) => ({ ...t, number: true }))} className={`${input(!!show("number"))} pr-24 font-mono tracking-wide`}
                  aria-invalid={!!show("number")} aria-describedby={show("number") ? "err-number" : undefined} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">{num ? brand : ""}</span>
              </div>
              {show("number") && <p id="err-number" className="text-xs text-red-600 mt-1">{errors.number}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="cc-exp" className="block text-sm font-medium text-slate-700 mb-1.5">Expiry</label>
                <input id="cc-exp" name="cc-exp" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" value={expiry}
                  onChange={(e) => onExpiry(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, expiry: true }))}
                  className={`${input(!!show("expiry"))} font-mono`} aria-invalid={!!show("expiry")} aria-describedby={show("expiry") ? "err-exp" : undefined} />
                {show("expiry") && <p id="err-exp" className="text-xs text-red-600 mt-1">{errors.expiry}</p>}
              </div>
              <div>
                <label htmlFor="cc-csc" className="block text-sm font-medium text-slate-700 mb-1.5">Security code</label>
                <input id="cc-csc" name="cc-csc" inputMode="numeric" autoComplete="cc-csc" type="password" placeholder={brand === "Amex" ? "4 digits" : "3 digits"}
                  value={cvc} onChange={(e) => setCvc(digits(e.target.value).slice(0, cvcLen))} onBlur={() => setTouched((t) => ({ ...t, cvc: true }))}
                  className={`${input(!!show("cvc"))} font-mono`} aria-invalid={!!show("cvc")} aria-describedby={show("cvc") ? "err-cvc" : undefined} />
                {show("cvc") && <p id="err-cvc" className="text-xs text-red-600 mt-1">{errors.cvc}</p>}
              </div>
            </div>

            <button type="submit" disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2">
              {submitting && <Spinner className="w-4 h-4" />}
              {submitting ? "Processing…" : `Pay ${formatNPR(payment.amount)}`}
            </button>
            <SecureNote />
            <p className="text-center">
              <Link href={`/payments/${payment.reference}`} className="text-sm text-slate-500 hover:text-slate-800">Cancel and go back</Link>
            </p>
          </form>

          {info?.sandbox && info.card_test && (
            <details className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-sm" open>
              <summary className="font-semibold text-slate-800 cursor-pointer">Test cards (sandbox only)</summary>
              <ul className="mt-3 divide-y divide-slate-100">
                {info.card_test.map((c) => (
                  <li key={c.number} className="flex items-center justify-between gap-3 py-2.5">
                    <div>
                      <p className="font-mono text-slate-800">{c.number}</p>
                      <p className="text-xs text-slate-500">{c.brand} · {c.result}</p>
                    </div>
                    <button type="button" onClick={() => fillTest(c.number)} className="text-xs font-semibold text-teal-700 hover:text-teal-800 px-3 py-1.5 rounded-lg border border-teal-200 hover:bg-teal-50">
                      Use
                    </button>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-500 mt-3">Any future expiry and any CVC work.</p>
            </details>
          )}
        </div>
      )}
    </PageShell>
  );
}

export default function CardCheckoutPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      <CardCheckout />
    </div>
  );
}
