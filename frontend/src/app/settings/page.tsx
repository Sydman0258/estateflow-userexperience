"use client";

import Header from "@/components/Header";
import PaymentsTab from "@/components/settings/PaymentsTab";
import PrivacyTab from "@/components/settings/PrivacyTab";
import ProfileTab from "@/components/settings/ProfileTab";
import SecurityTab from "@/components/settings/SecurityTab";
import { fetchMe } from "@/lib/api";
import { AuthUser, setAuth } from "@/lib/auth";
import { useAuthGuard } from "@/lib/useAuthGuard";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const TABS = [
  { id: "profile", label: "Profile", hint: "Name, phone, username" },
  { id: "security", label: "Security", hint: "Password, 2FA, devices" },
  { id: "payments", label: "Payments", hint: "Method & protection" },
  { id: "privacy", label: "Privacy & data", hint: "Export or deactivate" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function SettingsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { ready, user: storedUser } = useAuthGuard();
  const [user, setUser] = useState<AuthUser | null>(null);

  const requested = params.get("tab") as TabId | null;
  const tab: TabId = TABS.some((t) => t.id === requested) ? (requested as TabId) : "profile";

  useEffect(() => {
    if (!ready) return;
    setUser(storedUser);
    // Always show the server's truth (2FA state, last password change, etc.)
    fetchMe()
      .then((me) => {
        setUser(me);
        setAuth({}, me);
      })
      .catch(() => undefined);
  }, [ready, storedUser]);

  const go = (id: TabId) => router.replace(`/settings?tab=${id}`, { scroll: false });

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
      <p className="text-slate-500 text-sm mt-1.5">Manage your account, security and privacy.</p>

      <div className="mt-8 grid md:grid-cols-[220px_1fr] gap-8 items-start">
        <nav aria-label="Settings sections" className="md:sticky md:top-24">
          <ul role="tablist" className="flex md:flex-col gap-1 overflow-x-auto -mx-1 px-1 pb-2 md:pb-0">
            {TABS.map((t) => (
              <li key={t.id} className="shrink-0">
                <button
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => go(t.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl transition-colors ${
                    tab === t.id ? "bg-white shadow-sm border border-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900 hover:bg-white/60 border border-transparent"
                  }`}
                >
                  <span className="block text-sm font-semibold">{t.label}</span>
                  <span className="hidden md:block text-xs text-slate-400">{t.hint}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div role="tabpanel">
          {!user ? (
            <div className="space-y-4">{[0, 1].map((i) => <div key={i} className="h-48 rounded-2xl bg-slate-100 animate-pulse" />)}</div>
          ) : tab === "profile" ? (
            <ProfileTab user={user} onUser={setUser} />
          ) : tab === "security" ? (
            <SecurityTab user={user} onUser={setUser} />
          ) : tab === "payments" ? (
            <PaymentsTab role={user.role} />
          ) : (
            <PrivacyTab />
          )}
          <p className="mt-8 text-sm">
            <Link href={user?.role === "LANDLORD" ? "/landlord/dashboard" : "/tenant/dashboard"} className="text-teal-700 hover:text-teal-800 font-semibold">
              ← Back to dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      <Suspense fallback={<div className="max-w-5xl mx-auto py-16 text-center text-slate-500">Loading…</div>}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
