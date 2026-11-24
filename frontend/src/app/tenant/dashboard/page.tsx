"use client";

import Header from "@/components/Header";
import { getStoredUser } from "@/lib/auth";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function TenantDashboardPage() {
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      <div className="max-w-[1120px] mx-auto px-5 sm:px-8 py-10">
        {/* Top greeting banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-200/80 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/50">
                Tenant Portal
              </span>
              <span className="text-xs text-slate-400">• Verified Renter</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Hello, {user?.first_name || "Tenant"}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Track your rental leases, submit applications, and manage monthly rent payments.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/browse"
              className="bg-teal-700 hover:bg-teal-800 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Explore Homes
            </Link>
            <Link
              href="/tenant/profile"
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
            >
              My Profile
            </Link>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Lease
            </p>
            <p className="text-2xl font-bold text-teal-700 mt-2">1 Home</p>
            <p className="text-xs text-slate-500 mt-1">Atlantic Studio Loft (#1)</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Applications
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-2">2</p>
            <p className="text-xs text-slate-500 mt-1">1 in review, 1 approved</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Next Rent Due
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-2">$2,450</p>
            <p className="text-xs text-amber-600 font-medium mt-1">Due in 6 days (Dec 1)</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Payment Status
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-2">Good Standing</p>
            <p className="text-xs text-slate-500 mt-1">Zero overdue balances</p>
          </div>
        </div>

        {/* Portal Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/tenant/applications"
            className="group p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-teal-500/40 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
              Rental Applications →
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Check progress on submitted rental requests, lease status, and landlord approvals.
            </p>
          </Link>

          <Link
            href="/tenant/payments"
            className="group p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-teal-500/40 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
              Payment Invoices →
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              View rent invoices, pay monthly fees securely, and download verified receipts.
            </p>
          </Link>

          <Link
            href="/tenant/profile"
            className="group p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-teal-500/40 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">
              Tenant Profile →
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Update preferred locations, monthly rental budget, employment, and emergency contacts.
            </p>
          </Link>
        </div>

        {/* Current Active Rental Lease Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold uppercase text-teal-700 tracking-wider">
                Current Residence
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">The Atlantic Studio Loft</h2>
              <p className="text-xs text-slate-500">12 Atlantic Ave, Cobble Hill, Brooklyn, NY</p>
            </div>
            <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-semibold border border-teal-200/50">
              Active Lease
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-slate-400">Monthly Rent</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">$2,450 / mo</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-slate-400">Lease Term</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">Aug 2024 – Jul 2025</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-slate-400">Landlord Contact</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">Urban Living Ltd.</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              href="/properties/1/reviews"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Write property review →
            </Link>
            <div className="flex gap-2">
              <Link
                href="/tenant/payments"
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Pay upcoming rent ($2,450)
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
