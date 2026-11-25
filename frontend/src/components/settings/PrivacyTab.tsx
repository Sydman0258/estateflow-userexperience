"use client";

import { Notice } from "@/components/payments/ui";
import { clearAuth } from "@/lib/auth";
import { authFetch, sendJson } from "@/lib/http";
import { useState } from "react";
import { Card, Field, inputClass } from "./ui";

export default function PrivacyTab() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function exportData() {
    setExporting(true);
    setError("");
    try {
      const res = await authFetch("/auth/me/export/");
      if (!res.ok) throw new Error("Could not export your data.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "estateflow-my-data.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  async function deactivate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await sendJson("POST", "/auth/account/deactivate/", { password });
      clearAuth();
      window.location.href = "/auth/login";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not deactivate your account.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Download your data" description="A JSON file with your profile, security activity and payment records.">
        {error && <div className="mb-4"><Notice kind="error">{error}</Notice></div>}
        <button type="button" onClick={exportData} disabled={exporting}
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:border-slate-300 disabled:opacity-60">
          {exporting ? "Preparing…" : "Download my data"}
        </button>
      </Card>

      <Card tone="danger" title="Deactivate account" description="You'll be signed out everywhere and your listings and sign-in stop working. You can reactivate later by verifying your email with a one-time code.">
        {!confirming ? (
          <button type="button" onClick={() => setConfirming(true)} className="px-5 py-2.5 rounded-xl border border-red-200 text-sm font-semibold text-red-700 hover:bg-red-50">
            Deactivate my account…
          </button>
        ) : (
          <form onSubmit={deactivate} className="space-y-4 max-w-xs">
            <Field label="Enter your password to confirm" htmlFor="deact-pw">
              <input id="deact-pw" type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" autoFocus />
            </Field>
            <div className="flex gap-3">
              <button type="submit" disabled={busy || !password} className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50">
                {busy ? "Deactivating…" : "Deactivate"}
              </button>
              <button type="button" onClick={() => { setConfirming(false); setPassword(""); }} className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-800">Cancel</button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
