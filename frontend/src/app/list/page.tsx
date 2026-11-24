"use client";

import Header from "@/components/Header";
import { getStoredUser } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ListPropertyLandingPage() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
    if (u?.role === "LANDLORD") {
      router.push("/landlord/properties/new");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      <div className="max-w-[1000px] mx-auto px-5 sm:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="px-3 py-1 bg-teal-50 text-teal-800 rounded-full text-xs font-semibold uppercase tracking-wider">
            EstateFlow for Property Owners
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight mt-4">
            List your home with zero broker commissions
          </h1>
          <p className="text-slate-600 text-base sm:text-lg mt-3">
            Connect directly with verified renters, manage leases digitally, and collect monthly rent seamlessly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Link
              href="/landlord/properties/new"
              className="w-full sm:w-auto px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
            >
              Add New Property Now →
            </Link>
            <Link
              href="/auth/register/landlord"
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold rounded-xl text-sm transition-colors"
            >
              Create Landlord Account
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold mb-4">
              0%
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Zero Broker Commissions</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Keep 100% of your rental returns. Say goodbye to middleman fees, arbitrary deductions, and listing agent charges.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold mb-4">
              ✓
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Pre-Screened Renters</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every prospective tenant undergoes identity and employment verification with automated background checks.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold mb-4">
              ⚡
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Instant Direct Payouts</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Rent payments are automatically credited directly to your registered bank account on the first of every month.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
