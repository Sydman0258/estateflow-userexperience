"use client";

import Header from "@/components/Header";
import { activateAccount, resendOTP } from "@/lib/api";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function ActivateContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendNotice, setResendNotice] = useState("");

  useEffect(() => {
    const qEmail = searchParams.get("email");
    if (qEmail) setEmail(qEmail);
    if (searchParams.get("registered")) {
      setResendNotice("Account created! We sent a 6-digit code to your email. Enter it below to activate your account.");
      setCountdown(45);
    }
  }, [searchParams]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResendNotice("");
    try {
      await activateAccount(email, otp);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Activation failed. Please check your OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) {
      setError("Please enter your email address to resend OTP.");
      return;
    }
    setResending(true);
    setError("");
    setResendNotice("");
    try {
      await resendOTP(email);
      setResendNotice("A new one-time code has been sent to your email.");
      setCountdown(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-xl flex items-center justify-center mb-5">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-1">Verify your account</h1>
        <p className="text-slate-500 text-sm mb-6">
          Enter the 6-digit activation code sent to your registered email to activate your account.
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
            {error}
          </div>
        )}
        {resendNotice && (
          <div className="mb-4 text-sm text-teal-800 bg-teal-50 p-3 rounded-xl border border-teal-100">
            {resendNotice}
          </div>
        )}

        {success ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Account Activated!</h2>
            <p className="text-sm text-slate-500 mb-6">
              Your email has been verified. You can now proceed to log in.
            </p>
            <Link
              href={`/auth/login?email=${encodeURIComponent(email)}`}
              className="inline-block w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 rounded-xl transition-colors text-center"
            >
              Go to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Account email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-900"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">
                  6-digit activation code
                </label>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || countdown > 0}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-800 disabled:opacity-50"
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : resending ? "Resending..." : "Resend code"}
                </button>
              </div>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 tracking-[0.3em] text-center text-xl font-mono text-slate-900"
                placeholder="123456"
              />
              <p className="text-xs text-slate-400 mt-1">
                Codes expire after a few minutes. In local development the code is printed in the backend terminal.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "Activating..." : "Activate account"}
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <Link href="/auth/login" className="hover:text-slate-900">
            ← Back to sign in
          </Link>
          <Link href="/auth/register/tenant" className="hover:text-slate-900">
            Need an account?
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      <Suspense fallback={<div className="max-w-md mx-auto py-16 text-center text-slate-500">Loading activation form...</div>}>
        <ActivateContent />
      </Suspense>
    </div>
  );
}
