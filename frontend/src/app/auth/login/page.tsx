"use client";

import Header from "@/components/Header";
import { resendOTP } from "@/lib/api";
import { setAuth } from "@/lib/auth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [notActivated, setNotActivated] = useState(false);

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

  function finishLogin(data: {
    tokens?: { access?: string; refresh?: string };
    access?: string;
    refresh?: string;
    user?: { role?: string } & Record<string, unknown>;
  }) {
    // Store tokens and user profile
    const tokens = data.tokens || { access: data.access, refresh: data.refresh };
    setAuth(tokens, data.user as never);

    // Role-based destination
    if (data.user?.role === "LANDLORD") {
      router.push("/landlord/dashboard");
    } else if (data.user?.role === "TENANT") {
      router.push("/tenant/dashboard");
    } else {
      router.push("/browse");
    }
  }

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setNotActivated(false);

    try {
      const res = await fetch(`${API}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        const errorText =
          typeof data === "object"
            ? Object.values(data).flat().join(" ")
            : "Login failed";

        if (
          errorText.toLowerCase().includes("not activated") ||
          errorText.toLowerCase().includes("verify your email")
        ) {
          setNotActivated(true);
        }
        throw new Error(errorText);
      }

      // 2FA is off by default: the backend returns tokens straight away.
      if (data.tokens) {
        finishLogin(data);
        return;
      }

      setMessage(
        data.already_sent
          ? "A code was sent to your email moments ago. Enter it below."
          : "A 6-digit verification code has been sent to your email."
      );
      setStep("otp");
      setCountdown(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/auth/login/verify/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, otp }),
      });
      const data = await res.json();

      if (!res.ok) {
        const errDetail =
          typeof data === "object"
            ? Object.values(data).flat().join(" ")
            : "Verification failed";
        throw new Error(errDetail || "Invalid OTP");
      }

      finishLogin(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setError("");
    try {
      await resendOTP(email);
      setMessage("A new 6-digit OTP has been sent to your email.");
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
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Sign in</h1>
        <p className="text-slate-500 text-sm mb-6">
          Welcome back. Two-factor sign-in can be turned on in Settings.
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
            <p>{error}</p>
            {notActivated && (
              <div className="mt-2">
                <Link
                  href={`/auth/activate?email=${encodeURIComponent(email)}`}
                  className="font-semibold text-teal-800 underline hover:text-teal-900"
                >
                  Activate your account now →
                </Link>
              </div>
            )}
          </div>
        )}

        {message && (
          <div className="mb-4 text-sm text-teal-800 bg-teal-50 p-3 rounded-xl border border-teal-100">
            {message}
          </div>
        )}

        {step === "credentials" ? (
          <form onSubmit={handleCredentials} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
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
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-semibold text-teal-700 hover:text-teal-800"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-900"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">
                  One-time verification code
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
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 tracking-[0.3em] text-center text-xl font-mono text-slate-900"
                placeholder="000000"
                maxLength={6}
              />
              <p className="text-xs text-slate-400 mt-1">
                Sent to <span className="font-medium text-slate-600">{email}</span>
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? "Verifying code…" : "Verify & sign in"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("credentials");
                setOtp("");
              }}
              className="w-full text-sm text-slate-500 hover:text-slate-800 pt-1"
            >
              ← Back to credentials
            </button>
          </form>
        )}

        <div className="mt-8 pt-5 border-t border-slate-100 text-center text-sm text-slate-500">
          New to EstateFlow?{" "}
          <Link
            href="/auth/register/tenant"
            className="font-semibold text-teal-700 hover:text-teal-800"
          >
            Tenant signup
          </Link>
          {" · "}
          <Link
            href="/auth/register/landlord"
            className="font-semibold text-teal-700 hover:text-teal-800"
          >
            Landlord signup
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      <Suspense fallback={<div className="max-w-md mx-auto py-16 text-center text-slate-500">Loading sign-in...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
