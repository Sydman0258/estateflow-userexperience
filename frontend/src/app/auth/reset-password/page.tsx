"use client";

import Header from "@/components/Header";
import { resendOTP } from "@/lib/api";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendNotice, setResendNotice] = useState("");

  useEffect(() => {
    const qEmail = searchParams.get("email");
    if (qEmail) setEmail(qEmail);
  }, [searchParams]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResendNotice("");

    if (password.length < 9) {
      setError("Password must be at least 9 characters long.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // Send reset request (or backend OTP reset endpoint if configured)
      const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
      const res = await fetch(`${API}/auth/password/reset/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password, password_confirm: passwordConfirm }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          data && typeof data === "object"
            ? Object.values(data).flat().join(" ")
            : "";
        throw new Error(msg || "Password reset failed. Please check your verification code.");
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Password reset failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) {
      setError("Please provide your email address to resend the code.");
      return;
    }
    setResending(true);
    setError("");
    setResendNotice("");
    try {
      await resendOTP(email);
      setResendNotice("A new verification code has been dispatched to your email.");
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
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Set new password</h1>
        <p className="text-slate-500 text-sm mb-6">
          Provide your verification code and enter your new account password.
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
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Password Updated</h2>
            <p className="text-sm text-slate-500">
              Your password has been reset successfully. You can now log in with your new credentials.
            </p>
            <Link
              href={`/auth/login?email=${encodeURIComponent(email)}`}
              className="inline-block w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 rounded-xl transition-colors text-center"
            >
              Sign in with new password
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email address
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
                  6-digit reset code
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
                placeholder="000000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                New password
              </label>
              <input
                type="password"
                required
                minLength={9}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-900"
                placeholder="At least 9 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirm new password
              </label>
              <input
                type="password"
                required
                minLength={9}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-900"
                placeholder="Re-enter new password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "Updating password..." : "Reset password"}
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <Link href="/auth/login" className="hover:text-slate-900">
            ← Back to sign in
          </Link>
          <Link href="/auth/forgot-password" className="hover:text-slate-900">
            Request new code
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      <Suspense fallback={<div className="max-w-md mx-auto py-16 text-center text-slate-500">Loading reset form...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
