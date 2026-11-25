"use client";

import { useId, useState } from "react";

/** Nepali digit grouping (1,20,000) comes from the en-IN locale. */
const npr = (n: number) => `NPR ${n.toLocaleString("en-IN")}`;

export default function MoveInCost() {
  const [rent, setRent] = useState(60000);
  const sliderId = useId();

  const rows = [
    { label: "First month's rent", value: npr(rent) },
    { label: "Security deposit (one month)", value: npr(rent) },
    { label: "Broker fee", value: npr(0) },
  ];

  return (
    <div className="rounded-[28px] bg-white/[0.06] p-6 ring-1 ring-white/15 sm:p-8">
      <label htmlFor={sliderId} className="flex items-baseline justify-between gap-4">
        <span className="text-[15px] font-medium text-mist">Monthly rent</span>
        <output
          htmlFor={sliderId}
          className="font-display text-[22px] font-semibold tabular-nums text-snow"
        >
          {npr(rent)}
        </output>
      </label>
      <input
        id={sliderId}
        type="range"
        min={15000}
        max={200000}
        step={5000}
        value={rent}
        onChange={(e) => setRent(Number(e.target.value))}
        className="mt-4 h-2 w-full cursor-pointer accent-marigold"
      />
      <div className="mt-1 flex justify-between text-[12px] text-mist/70">
        <span>NPR 15,000</span>
        <span>NPR 2,00,000</span>
      </div>

      <dl className="mt-7 divide-y divide-white/15 border-y border-white/15">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-4 py-3.5">
            <dt className="text-[15px] text-mist">{r.label}</dt>
            <dd className="text-[16px] font-semibold tabular-nums text-snow">{r.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex items-end justify-between gap-4">
        <span className="text-[15px] font-medium text-mist">Due at move-in</span>
        <span
          aria-live="polite"
          className="font-display text-[clamp(1.9rem,4.5vw,2.75rem)] font-semibold leading-none tabular-nums text-marigold"
        >
          {npr(rent * 2)}
        </span>
      </div>
      <p className="mt-5 text-[13px] leading-relaxed text-mist/80">
        You pay this only after the landlord accepts your application, by eSewa or card.
      </p>
    </div>
  );
}
