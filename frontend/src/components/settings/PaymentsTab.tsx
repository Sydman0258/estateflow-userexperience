"use client";

import { MethodMark } from "@/components/payments/ui";
import { PaymentMethod } from "@/lib/payments";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "./ui";

const PREF_KEY = "estateflow_pref_method";

export default function PaymentsTab({ role }: { role: string }) {
  const [pref, setPref] = useState<PaymentMethod | "">("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPref((localStorage.getItem(PREF_KEY) as PaymentMethod | null) ?? "");
  }, []);

  function choose(m: PaymentMethod) {
    setPref(m);
    localStorage.setItem(PREF_KEY, m);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="space-y-6">
      {role === "TENANT" && (
        <Card title="Preferred payment method" description="We'll pre-select this at checkout. You can always pick another one.">
          <div className="grid sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Preferred payment method">
            {([["ESEWA", "eSewa", "Wallet payment"], ["CARD", "Credit / debit card", "Visa, Mastercard, Amex"]] as const).map(([id, label, sub]) => (
              <button key={id} type="button" role="radio" aria-checked={pref === id} onClick={() => choose(id)}
                className={`flex items-center gap-3 text-left rounded-xl border p-4 transition-all ${pref === id ? "border-teal-600 bg-teal-50/60 ring-2 ring-teal-600/20" : "border-slate-200 hover:border-slate-300"}`}>
                <MethodMark method={id} />
                <span><span className="block font-semibold text-slate-900">{label}</span><span className="block text-sm text-slate-500">{sub}</span></span>
              </button>
            ))}
          </div>
          <p className="text-xs h-4 mt-3 text-teal-700" aria-live="polite">{saved ? "Saved." : ""}</p>
        </Card>
      )}

      <Card title="How your payments are protected">
        <ul className="space-y-3 text-sm text-slate-600">
          {[
            "The amount is calculated on our server. It can't be changed from your browser.",
            "Every eSewa payment is verified by signature and confirmed directly with eSewa before it counts as paid.",
            "We never store your full card number or security code. Only the card type and last 4 digits are kept for your receipt.",
            "Each payment has a tamper-proof activity trail you can see on its receipt page.",
          ].map((t) => (
            <li key={t} className="flex gap-3"><span aria-hidden className="text-teal-700 mt-0.5">✓</span>{t}</li>
          ))}
        </ul>
        <Link href={role === "LANDLORD" ? "/landlord/payments" : "/tenant/payments"} className="inline-block mt-5 text-sm font-semibold text-teal-700 hover:text-teal-800">
          View payment history →
        </Link>
      </Card>
    </div>
  );
}
