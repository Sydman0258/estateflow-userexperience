"use client";

import { Notice } from "@/components/payments/ui";
import { twoFactorDisable, twoFactorEnable, twoFactorSend } from "@/lib/api";
import { AuthUser, setAuth } from "@/lib/auth";
import { apiJson, HttpError, sendJson } from "@/lib/http";
import { useCallback, useEffect, useState } from "react";
import PasswordStrength, { scorePassword } from "./PasswordStrength";
import { Card, describeDevice, Field, inputClass, timeAgo } from "./ui";

/* ---------- security checklist ---------- */
function Checklist({ user }: { user: AuthUser }) {
  const items = [
    { ok: true, title: "Email verified", text: "Your address was confirmed with a one-time code." },
    { ok: !!user.password_changed_at, title: "Password set by you", text: user.password_changed_at ? `Last changed ${timeAgo(user.password_changed_at)}.` : "Change your password if it was shared or reused elsewhere." },
    { ok: !!user.two_factor_enabled, title: "Two-factor sign-in", text: user.two_factor_enabled ? "On: a code is needed at every sign-in." : "Off. Turn it on for the strongest protection." },
  ];
  const done = items.filter((i) => i.ok).length;
  return (
    <Card title="Security check-up" description={`${done} of ${items.length} protections in place.`}>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-5" aria-hidden>
        <div className="h-full bg-teal-600 transition-all" style={{ width: `${(done / items.length) * 100}%` }} />
      </div>
      <ul className="space-y-3">
        {items.map((i) => (
          <li key={i.title} className="flex gap-3">
            <span aria-hidden className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${i.ok ? "bg-teal-600 text-white" : "bg-amber-100 text-amber-700"}`}>
              {i.ok ? "✓" : "!"}
            </span>
            <div>
              <p className="text-sm font-medium text-slate-900">{i.title}</p>
              <p className="text-sm text-slate-500">{i.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ---------- change password ---------- */
function PasswordCard({ user }: { user: AuthUser }) {
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState("");

  const { score } = scorePassword(pw, user.email);
  const mismatch = confirm.length > 0 && pw !== confirm;
  const canSubmit = cur && pw.length >= 8 && score >= 2 && pw === confirm && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setErrors({});
    setDone("");
    try {
      const data = await sendJson<{ detail: string; tokens: { access: string; refresh: string }; user: AuthUser }>(
        "POST", "/auth/password/change/", { current_password: cur, new_password: pw, new_password_confirm: confirm }
      );
      setAuth(data.tokens, data.user); // keep this device signed in with fresh tokens
      setCur(""); setPw(""); setConfirm("");
      setDone(data.detail);
    } catch (err: unknown) {
      if (err instanceof HttpError && err.data && typeof err.data === "object" && !("detail" in (err.data as object))) {
        const map: Record<string, string> = {};
        Object.entries(err.data as Record<string, unknown>).forEach(([k, v]) => (map[k] = Array.isArray(v) ? v.join(" ") : String(v)));
        setErrors(map);
      } else setError(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Change password" description="You'll be signed out of every other device when you change it.">
      <form onSubmit={submit} className="space-y-4 max-w-md" noValidate>
        {error && <Notice kind="error">{error}</Notice>}
        {done && <Notice kind="success">{done}</Notice>}
        <Field label="Current password" htmlFor="cur-pw" error={errors.current_password}>
          <input id="cur-pw" type={show ? "text" : "password"} className={inputClass} value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
        </Field>
        <Field label="New password" htmlFor="new-pw" error={errors.new_password}>
          <input id="new-pw" type={show ? "text" : "password"} className={inputClass} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
          <PasswordStrength password={pw} email={user.email} />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm-pw" error={mismatch ? "Passwords do not match." : errors.new_password_confirm}>
          <input id="confirm-pw" type={show ? "text" : "password"} className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer w-fit">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show passwords
        </label>
        <button type="submit" disabled={!canSubmit} className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold disabled:opacity-40 transition-colors">
          {busy ? "Updating…" : "Update password"}
        </button>
      </form>
    </Card>
  );
}

/* ---------- two-factor ---------- */
function TwoFactorCard({ user, onUser }: { user: AuthUser; onUser: (u: AuthUser) => void }) {
  const [mode, setMode] = useState<"idle" | "enabling" | "disabling">("idle");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const enabled = !!user.two_factor_enabled;

  const reset = () => { setMode("idle"); setOtp(""); setPassword(""); setError(""); };
  const update = (u: AuthUser) => { setAuth({}, u); onUser(u); };

  async function start() {
    setBusy(true); setError(""); setNotice("");
    try {
      await twoFactorSend();
      setMode("enabling");
      setNotice("We emailed you a 6-digit code. Enter it below to turn on two-factor sign-in.");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Could not send the code."); }
    finally { setBusy(false); }
  }
  async function confirmEnable(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const data = await twoFactorEnable(null, otp);
      update(data.user); reset();
      setNotice("Two-factor authentication is now ON. You'll enter an emailed code each time you sign in.");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Could not enable two-factor."); }
    finally { setBusy(false); }
  }
  async function confirmDisable(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const data = await twoFactorDisable(null, password);
      update(data.user); reset(); setNotice("Two-factor authentication is now OFF.");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Could not disable two-factor."); }
    finally { setBusy(false); }
  }

  return (
    <Card title="Two-factor authentication" description="Add a one-time email code after your password. Off by default, you're in control.">
      <div className="flex items-center justify-between gap-4">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${enabled ? "bg-teal-50 text-teal-800 border-teal-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
          {enabled ? "On" : "Off"}
        </span>
        {mode === "idle" && (enabled ? (
          <button type="button" onClick={() => { setNotice(""); setMode("disabling"); }} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:border-red-300 hover:text-red-600 transition-colors">Turn off</button>
        ) : (
          <button type="button" onClick={start} disabled={busy} className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold disabled:opacity-60 transition-colors">{busy ? "Sending code…" : "Turn on"}</button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {error && <Notice kind="error">{error}</Notice>}
        {notice && <Notice kind="success">{notice}</Notice>}
      </div>
      {mode === "enabling" && (
        <form onSubmit={confirmEnable} className="mt-5 space-y-4 max-w-xs">
          <Field label="Verification code" htmlFor="tfa-otp" hint="In local development the code is printed in the backend terminal.">
            <input id="tfa-otp" className={`${inputClass} tracking-[0.3em] text-center text-xl font-mono`} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} maxLength={6} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" autoFocus />
          </Field>
          <div className="flex gap-3">
            <button type="submit" disabled={busy || otp.length !== 6} className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold disabled:opacity-50">{busy ? "Verifying…" : "Confirm & turn on"}</button>
            <button type="button" onClick={reset} className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-800">Cancel</button>
          </div>
        </form>
      )}
      {mode === "disabling" && (
        <form onSubmit={confirmDisable} className="mt-5 space-y-4 max-w-xs">
          <Field label="Enter your password to confirm" htmlFor="tfa-pw">
            <input id="tfa-pw" type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" autoFocus />
          </Field>
          <div className="flex gap-3">
            <button type="submit" disabled={busy || !password} className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50">{busy ? "Turning off…" : "Turn off"}</button>
            <button type="button" onClick={reset} className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-800">Cancel</button>
          </div>
        </form>
      )}
    </Card>
  );
}

/* ---------- sessions ---------- */
function SessionsCard() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function revoke() {
    setBusy(true); setError(""); setMsg("");
    try {
      const data = await sendJson<{ detail: string; tokens: { access: string; refresh: string } }>("POST", "/auth/sessions/revoke/");
      setAuth(data.tokens);
      setMsg(data.detail + " Other devices lose access within 15 minutes at the latest.");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Could not sign out other devices."); }
    finally { setBusy(false); }
  }

  return (
    <Card title="Signed-in devices" description="Lost a phone or used a shared computer? Sign out everywhere else. This device stays signed in.">
      <div className="space-y-3">
        {error && <Notice kind="error">{error}</Notice>}
        {msg && <Notice kind="success">{msg}</Notice>}
        <button type="button" onClick={revoke} disabled={busy} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:border-slate-300 disabled:opacity-60">
          {busy ? "Signing out…" : "Sign out of all other devices"}
        </button>
      </div>
    </Card>
  );
}

/* ---------- activity ---------- */
interface AuthEventRow { id: number; label: string; success: boolean; ip_address: string | null; user_agent: string; created_at: string }

function ActivityCard() {
  const [rows, setRows] = useState<AuthEventRow[] | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    apiJson<AuthEventRow[]>("/auth/security/activity/").then(setRows).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  return (
    <Card title="Recent security activity" description="Sign-ins and account changes. If something here isn't you, change your password now.">
      {error && <Notice kind="error">{error}</Notice>}
      {!rows && !error && <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />)}</div>}
      {rows && rows.length === 0 && <p className="text-sm text-slate-500">No activity recorded yet.</p>}
      {rows && rows.length > 0 && (
        <ul className="divide-y divide-slate-100 -my-2">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-3">
              <span aria-hidden className={`w-2.5 h-2.5 rounded-full shrink-0 ${r.success ? "bg-teal-500" : "bg-red-500"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{r.label}</p>
                <p className="text-xs text-slate-500 truncate">{describeDevice(r.user_agent)}{r.ip_address ? ` · ${r.ip_address}` : ""}</p>
              </div>
              <time className="text-xs text-slate-400 whitespace-nowrap" dateTime={r.created_at}>{timeAgo(r.created_at)}</time>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function SecurityTab({ user, onUser }: { user: AuthUser; onUser: (u: AuthUser) => void }) {
  return (
    <div className="space-y-6">
      <Checklist user={user} />
      <PasswordCard user={user} />
      <TwoFactorCard user={user} onUser={onUser} />
      <SessionsCard />
      <ActivityCard />
    </div>
  );
}
