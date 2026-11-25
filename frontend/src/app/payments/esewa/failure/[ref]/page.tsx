"use client";

import Header from "@/components/Header";
import { Notice, PageShell } from "@/components/payments/ui";
import { cancelPayment, getPayment } from "@/lib/payments";
import { useAuthGuard } from "@/lib/useAuthGuard";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function EsewaFailurePage() {
  const { ref } = useParams<{ ref: string }>();
  const { ready } = useAuthGuard();
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const done = useRef(false);

  useEffect(() => {
    if (!ready || done.current) return;
    done.current = true;
    cancelPayment(ref, "gateway_failure")
      .catch(() => undefined) // already final is fine
      .finally(() => {
        getPayment(ref)
          .then((p) => {
            setPropertyId(p.property_id);
            if (p.status === "COMPLETED") setNote("Good news: this payment actually went through.");
          })
          .catch(() => undefined);
      });
  }, [ready, ref]);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      <PageShell title="Payment not completed" subtitle="You were not charged for this attempt." narrow>
        <div className="space-y-4">
          <Notice kind={note ? "success" : "warning"}>
            {note || "The payment was cancelled or declined at eSewa. No money was taken."}
          </Notice>
          <div className="flex flex-wrap gap-3">
            <Link
              href={propertyId ? `/tenant/payments/new?property=${propertyId}` : "/tenant/payments/new"}
              className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold"
            >
              Try again
            </Link>
            <Link href="/tenant/payments" className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:border-slate-300">
              Back to payments
            </Link>
          </div>
        </div>
      </PageShell>
    </div>
  );
}
