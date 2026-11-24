"use client";

import Header from "@/components/Header";
import { fetchMe, twoFactorDisable, twoFactorEnable, twoFactorSend } from "@/lib/api";
import { AuthUser, getStoredTokens, getStoredUser, setAuth } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Mode = "idle" | "enabling" | "disabling";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("idle");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const { access } = getStoredTokens();
    if (!access) {
      router.replace("/auth/login");
      return;
    }
    setUser(getStoredUser());
    setReady(true);
    // Refresh from the server so the toggle reflects the real setting.
    fetchMe(access)
      .then((me: AuthUser) => {
        setUser(me);
        setAuth({}, me);
      })
      .catch(() => undefined);
  }, [router]);

  function reset() {
    setMode("idle");
    setOtp("");
    setPassword("");
    setError("");
  }

  async function startEnable() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { access } = getStoredTokens();
      await twoFactorSend(access);
      setMode("enabling");
      setNotice("We emailed you a 6-digit code. Enter it below to turn on two-factor sign-in.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not send the code.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnable(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { access } = getStoredTokens();
      const data = await twoFactorEnable(access, otp);
      setAuth({}, data.user);
      setUser(data.user);
      reset();
      setNotice("Two-factor authentication is now ON. You'll enter an emailed code each time you sign in.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not enable two-factor authentication.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDisable(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { access } = getStoredTokens();
      const data = await twoFactorDisable(access, password);
      setAuth({}, data.user);
      setUser(data.user);
      reset();
      setNotice("Two-factor authentication is now OFF.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not disable two-factor authentication.");
    } finally {
      setBusy(false);
    }
  }

  const enabled = !!user?.two_factor_enabled;
  const input =
    "w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-900";

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-12">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Settings</h1>
        <p className="text-slate-500 text-sm mb-8">
          Manage your account security
          {user?.email ? <> for <span className="font-medium text-slate-700">{user.email}</span></> : null}.
        </p>

        {!ready ? (
          <p className="text-slate-500 text-sm">Loading…</p>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Two-factor authentication</h2>
                <p className="text-sm text-slate-500 mt-1 max-w-md">
                  Add an extra step at sign-in: after your password, enter a one-time code we email you.
                  It is off by default.
                </p>
              </div>
              <span
                className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full border ${
                  enabled
                    ? "bg-teal-50 text-teal-800 border-teal-200"
                    : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                {enabled ? "On" : "Off"}
              </span>
            </div>

            {error && (
              <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{error}</div>
            )}
            {notice && (
              <div className="mt-4 text-sm text-teal-800 bg-teal-50 p-3 rounded-xl border border-teal-100">{notice}</div>
            )}

            {mode === "idle" && (
              <div className="mt-6">
                {enabled ? (
                  <button
                    type="button"
                    onClick={() => {
                      setNotice("");
                      setMode("disabling");
                    }}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:border-red-300 hover:text-red-600 transition-colors"
                  >
                    Turn off two-factor
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startEnable}
                    disabled={busy}
                    className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                  >
                    {busy ? "Sending code…" : "Turn on two-factor"}
                  </button>
                )}
              </div>
            )}

            {mode === "enabling" && (
              <form onSubmit={confirmEnable} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Verification code</label>
                  <input
                    className={`${input} tracking-[0.3em] text-center text-xl font-mono`}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    maxLength={6}
                    placeholder="000000"
                    inputMode="numeric"
                    autoFocus
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    In local development the code is printed in the backend terminal.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={busy || otp.length !== 6}
                    className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold disabled:opacity-60"
                  >
                    {busy ? "Verifying…" : "Confirm & turn on"}
                  </button>
                  <button type="button" onClick={reset} className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-800">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {mode === "disabling" && (
              <form onSubmit={confirmDisable} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Enter your password to confirm
                  </label>
                  <input
                    type="password"
                    className={input}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={busy || !password}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-60"
                  >
                    {busy ? "Turning off…" : "Turn off two-factor"}
                  </button>
                  <button type="button" onClick={reset} className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-800">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <p className="mt-6 text-sm">
          <Link href={user?.role === "LANDLORD" ? "/landlord/dashboard" : "/tenant/dashboard"} className="text-teal-700 hover:text-teal-800 font-semibold">
            ← Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
