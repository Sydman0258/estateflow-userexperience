"use client";

import Header from "@/components/Header";
import { RentalApplication } from "@/lib/api";
import Link from "next/link";
import { useState } from "react";

const INITIAL_APPLICATIONS: RentalApplication[] = [
  {
    id: 101,
    property_id: 1,
    property_name: "The Atlantic Studio Loft",
    property_location: "Cobble Hill, Brooklyn, NY",
    rent: 2450,
    status: "ACTIVE",
    move_in_date: "2024-08-01",
    submitted_at: "2024-07-15",
    notes: "12-month lease executed. Deposit verified.",
  },
  {
    id: 102,
    property_id: 2,
    property_name: "SOMA Creative Residence",
    property_location: "SoMa, San Francisco, CA",
    rent: 2200,
    status: "PENDING",
    move_in_date: "2024-12-15",
    submitted_at: "2024-11-20",
    notes: "Application under review by landlord. Employment documents received.",
  },
  {
    id: 103,
    property_id: 3,
    property_name: "Brownstone Garden Flat",
    property_location: "Lincoln Park, Chicago, IL",
    rent: 2500,
    status: "APPROVED",
    move_in_date: "2025-01-01",
    submitted_at: "2024-11-10",
    notes: "Approved! Ready for digital lease signature and security deposit.",
  },
];

export default function TenantApplicationsPage() {
  const [applications, setApplications] = useState<RentalApplication[]>(INITIAL_APPLICATIONS);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "ACTIVE">("ALL");

  const filtered = applications.filter((app) => (filter === "ALL" ? true : app.status === filter));

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      <div className="max-w-[1120px] mx-auto px-5 sm:px-8 py-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <Link href="/tenant/dashboard" className="hover:text-slate-900">
            Tenant Portal
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-medium">Rental Applications</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              My Rental Applications
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Track the approval status of your home rental applications and active leases.
            </p>
          </div>
          <Link
            href="/browse"
            className="bg-teal-700 hover:bg-teal-800 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm inline-flex items-center gap-2 self-start sm:self-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Find more homes
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit my-6">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Applications ({applications.length})
          </button>
          <button
            onClick={() => setFilter("PENDING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "PENDING" ? "bg-white text-amber-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Pending Review ({applications.filter((a) => a.status === "PENDING").length})
          </button>
          <button
            onClick={() => setFilter("APPROVED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "APPROVED" ? "bg-white text-teal-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Approved ({applications.filter((a) => a.status === "APPROVED").length})
          </button>
          <button
            onClick={() => setFilter("ACTIVE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "ACTIVE" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Active Leases ({applications.filter((a) => a.status === "ACTIVE").length})
          </button>
        </div>

        {/* Application Cards */}
        {filtered.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-100">
            <p className="text-slate-600 font-medium">No applications found in this section</p>
            <p className="text-xs text-slate-400 mt-1">Browse verified homes and submit your application.</p>
            <Link
              href="/browse"
              className="mt-4 inline-block bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-medium"
            >
              Browse Homes
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{app.property_name}</h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          app.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : app.status === "APPROVED"
                            ? "bg-teal-50 text-teal-700 border border-teal-200/60"
                            : "bg-amber-50 text-amber-700 border border-amber-200/60"
                        }`}
                      >
                        {app.status === "ACTIVE"
                          ? "Lease Active"
                          : app.status === "APPROVED"
                          ? "Application Approved"
                          : "Under Landlord Review"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{app.property_location}</p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-400">Monthly Rent</span>
                    <p className="text-lg font-bold text-slate-900">${app.rent.toLocaleString()}/mo</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="text-slate-400 font-medium">Application ID</span>
                    <p className="font-semibold text-slate-800 mt-0.5">#APP-{app.id}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="text-slate-400 font-medium">Desired Move-in Date</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{app.move_in_date}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="text-slate-400 font-medium">Submission Date</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{app.submitted_at}</p>
                  </div>
                </div>

                {app.notes && (
                  <div className="p-3 bg-slate-50/80 rounded-xl text-xs text-slate-600 mb-4 border border-slate-100">
                    <span className="font-semibold text-slate-800">Status Update:</span> {app.notes}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <Link
                    href={`/properties/${app.property_id}`}
                    className="text-xs font-semibold text-teal-700 hover:underline"
                  >
                    View Property Details →
                  </Link>

                  <div className="flex gap-2">
                    {app.status === "APPROVED" && (
                      <Link
                        href="/tenant/payments"
                        className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold transition-colors"
                      >
                        Sign Lease & Pay Deposit
                      </Link>
                    )}
                    {app.status === "ACTIVE" && (
                      <Link
                        href={`/properties/${app.property_id}/reviews`}
                        className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Write Review
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
