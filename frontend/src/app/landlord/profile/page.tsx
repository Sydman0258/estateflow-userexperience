"use client";

import Header from "@/components/Header";
import { AuthUser, getStoredUser, setAuth } from "@/lib/auth";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandlordProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // LandlordProfile specific fields
  const [companyName, setCompanyName] = useState("Urban Living Properties Ltd.");
  const [businessReg, setBusinessReg] = useState("NP-REG-2024-8891");
  const [bio, setBio] = useState(
    "Experienced residential landlord specializing in premium furnished urban apartments across prime metro districts."
  );
  const [phone, setPhone] = useState("+977 9801234567");

  useEffect(() => {
    const u = getStoredUser();
    if (u) {
      setUser(u);
      if (u.phone_number) setPhone(u.phone_number);
    }
  }, []);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    // Simulate updating profile
    setTimeout(() => {
      setSaving(false);
      setEditing(false);
      setSavedNotice(true);
      if (user) {
        const updated = { ...user, phone_number: phone };
        setUser(updated);
        setAuth({}, updated);
      }
      setTimeout(() => setSavedNotice(false), 3000);
    }, 600);
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      <div className="max-w-[840px] mx-auto px-5 sm:px-8 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <Link href="/landlord/dashboard" className="hover:text-slate-900">
            Landlord Portal
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-medium">Landlord Profile</span>
        </div>

        {savedNotice && (
          <div className="mb-6 p-4 rounded-xl bg-teal-50 text-teal-800 border border-teal-100 text-sm flex items-center justify-between">
            <span>Profile and company information updated successfully.</span>
            <button
              onClick={() => setSavedNotice(false)}
              className="text-teal-700 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
          <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center text-2xl font-bold">
                  {user?.first_name ? user.first_name[0] : "L"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">
                      {user ? `${user.first_name} ${user.last_name}` : "Verified Landlord"}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ✓ Verified
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm mt-0.5">
                    {companyName} • Member since {user?.date_joined ? new Date(user.date_joined).getFullYear() : "2024"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditing(!editing)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-colors border border-white/15 self-start sm:self-center"
              >
                {editing ? "Cancel Editing" : "Edit Profile"}
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {editing ? (
              <form onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Business Registration Number
                    </label>
                    <input
                      type="text"
                      value={businessReg}
                      onChange={(e) => setBusinessReg(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Direct Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Bio & Landlord Overview
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    About the Landlord / Business
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{bio}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <span className="text-xs text-slate-400 font-medium">Business / Company</span>
                    <p className="font-semibold text-slate-900 text-sm mt-0.5">{companyName}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <span className="text-xs text-slate-400 font-medium">Registration Number</span>
                    <p className="font-semibold text-slate-900 text-sm mt-0.5">{businessReg}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <span className="text-xs text-slate-400 font-medium">Primary Email</span>
                    <p className="font-semibold text-slate-900 text-sm mt-0.5">{user?.email || "landlord@estateflow.com"}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <span className="text-xs text-slate-400 font-medium">Contact Phone</span>
                    <p className="font-semibold text-slate-900 text-sm mt-0.5">{phone}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security & Verification status */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
          <h2 className="text-base font-bold text-slate-900 mb-4">Account Security & Verification</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <p className="text-sm font-medium text-slate-900">Two-Factor Authentication (2FA)</p>
                <p className="text-xs text-slate-500">Email OTP verification required on every login</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">Account Password</p>
                <p className="text-xs text-slate-500">Regularly updated for security</p>
              </div>
              <Link
                href="/auth/forgot-password"
                className="text-xs font-semibold text-teal-700 hover:underline"
              >
                Change password
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
