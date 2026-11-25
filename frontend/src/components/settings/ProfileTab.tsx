"use client";

import { AuthUser, setAuth } from "@/lib/auth";
import { HttpError, sendJson } from "@/lib/http";
import { useState } from "react";
import { Notice } from "@/components/payments/ui";
import { Card, Field, inputClass } from "./ui";

export default function ProfileTab({ user, onUser }: { user: AuthUser; onUser: (u: AuthUser) => void }) {
  const [form, setForm] = useState({
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    username: user.username ?? "",
    phone_number: user.phone_number ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const dirty = (Object.keys(form) as (keyof typeof form)[]).some((k) => form[k] !== (user[k] ?? ""));
  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || user.email[0].toUpperCase();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [k]: e.target.value });
    setSaved(false);
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setFieldErrors({});
    try {
      const updated = await sendJson<AuthUser>("PATCH", "/auth/me/", form);
      setAuth({}, updated);
      onUser(updated);
      setSaved(true);
    } catch (err: unknown) {
      if (err instanceof HttpError && err.data && typeof err.data === "object") {
        const map: Record<string, string> = {};
        Object.entries(err.data as Record<string, unknown>).forEach(([k, v]) => {
          if (k !== "detail") map[k] = Array.isArray(v) ? String(v[0]) : String(v);
        });
        if (Object.keys(map).length) setFieldErrors(map);
        else setError(err.message);
      } else setError(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Your profile" description="This is how you appear to landlords and tenants.">
        <div className="flex items-center gap-4 mb-6">
          <div aria-hidden className="w-14 h-14 rounded-full bg-teal-700 text-white text-lg font-bold flex items-center justify-center">{initials}</div>
          <div>
            <p className="font-semibold text-slate-900">{[user.first_name, user.last_name].filter(Boolean).join(" ") || user.username}</p>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              {user.email}
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">Verified</span>
            </p>
          </div>
          <span className="ml-auto text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600 capitalize">{user.role.toLowerCase()}</span>
        </div>

        <form onSubmit={save} className="space-y-4" noValidate>
          {error && <Notice kind="error">{error}</Notice>}
          {saved && <Notice kind="success">Profile saved.</Notice>}
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="First name" htmlFor="first_name" error={fieldErrors.first_name}>
              <input id="first_name" className={inputClass} value={form.first_name} onChange={set("first_name")} autoComplete="given-name" />
            </Field>
            <Field label="Last name" htmlFor="last_name" error={fieldErrors.last_name}>
              <input id="last_name" className={inputClass} value={form.last_name} onChange={set("last_name")} autoComplete="family-name" />
            </Field>
          </div>
          <Field label="Username" htmlFor="username" error={fieldErrors.username}>
            <input id="username" className={inputClass} value={form.username} onChange={set("username")} autoComplete="username" />
          </Field>
          <Field label="Phone number" htmlFor="phone_number" hint="Include the country code, e.g. +97798XXXXXXXX" error={fieldErrors.phone_number}>
            <input id="phone_number" type="tel" className={inputClass} value={form.phone_number} onChange={set("phone_number")} autoComplete="tel" />
          </Field>
          <Field label="Email" htmlFor="email" hint="Your email is your sign-in ID and can't be changed here.">
            <input id="email" className={inputClass} value={user.email} disabled />
          </Field>
          <div className="pt-1">
            <button type="submit" disabled={!dirty || saving}
              className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold disabled:opacity-40 transition-colors">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
