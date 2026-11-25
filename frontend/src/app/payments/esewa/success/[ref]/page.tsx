"use client";

import Header from "@/components/Header";
import { Notice, PageShell, Spinner } from "@/components/payments/ui";
import { HttpError } from "@/lib/http";
import { verifyEsewa } from "@/lib/payments";
import { useAuthGuard } from "@/lib/useAuthGuard";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

function EsewaSuccess() {
  const { ref } = useParams<{ ref: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const { ready } = useAuthGuard();
  const [state, setState] = useState<"verifying" | "failed">("verifying");
  const [error, setError] = useState("");
  const [retryable, setRetryable] = useState(false);
  const data = useRef<string | null>(null);
  const started = useRef(false);

  const verify = useCallback(async () => {
    if (!data.current) {
      setState("failed");
      setError("No payment confirmation was received from eSewa.");
      return;
    }
    setState("verifying");
    try {
      await verifyEsewa(ref, data.current);
      router.replace(`/payments/${ref}?paid=1`);
    } catch (e: unknown) {
      setState("failed");
      setError(e instanceof Error ? e.message : "Verification failed.");
      setRetryable(e instanceof HttpError && e.status === 503);
    }
  }, [ref, router]);

  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    data.current = params.get("data");
    // Remove the signed payload from the address bar, history and referrer.
    window.history.replaceState(null, "", window.location.pathname);
    verify();
  }, [ready, params, verify]);

  return (
    <PageShell title="Confirming your payment" narrow>
      {state === "verifying" ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 flex flex-col items-center gap-4 text-center" role="status">
          <Spinner className="w-9 h-9 text-teal-700" />
          <p className="font-semibold text-slate-900">Verifying with eSewa…</p>
          <p className="text-sm text-slate-500 max-w-sm">We check the signature and confirm the amount directly with eSewa. This only takes a moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <Notice kind="error">{error}</Notice>
          <div className="flex gap-3">
            {retryable && (
              <button onClick={verify} className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold">Try again</button>
            )}
            <Link href={`/payments/${ref}`} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:border-slate-300">
              View payment status
            </Link>
          </div>
        </div>
      )}
    </PageShell>
  );
}

export default function EsewaSuccessPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      <Suspense fallback={null}>
        <EsewaSuccess />
      </Suspense>
    </div>
  );
}
