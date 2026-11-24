"use client";

import Header from "@/components/Header";
import { fetchProperties, Property } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandlordDashboardPage() {
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    fetchProperties({ available: undefined })
      .then((data) => setProperties(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const totalRent = properties.reduce((acc, p) => acc + (p.price || 0), 0);
  const availableCount = properties.filter((p) => p.is_available).length;
  const occupiedCount = properties.length - availableCount;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      <div className="max-w-[1120px] mx-auto px-5 sm:px-8 py-10">
        {/* Top greeting banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-200/80 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/50">
                Landlord Portal
              </span>
              <span className="text-xs text-slate-400">• EstateFlow Verified</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back, {user?.first_name || "Landlord"}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Manage your rental properties, monitor availability, and track monthly returns.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/landlord/properties/new"
              className="bg-teal-700 hover:bg-teal-800 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add new property
            </Link>
            <Link
              href="/landlord/profile"
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
            >
              My profile
            </Link>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Properties
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{properties.length}</p>
            <p className="text-xs text-slate-500 mt-1">Listed under your account</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Available to Rent
            </p>
            <p className="text-3xl font-bold text-teal-700 mt-2">{availableCount}</p>
            <p className="text-xs text-slate-500 mt-1">Active on public marketplace</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Occupied / Leased
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{occupiedCount}</p>
            <p className="text-xs text-slate-500 mt-1">Active rental leases</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Est. Monthly Rent
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              ${totalRent.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-1">Total property portfolio rent</p>
          </div>
        </div>

        {/* Portal Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/landlord/properties"
            className="group p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-teal-500/40 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
              Manage Properties →
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Edit pricing, modify descriptions, change availability status, or remove listings.
            </p>
          </Link>

          <Link
            href="/landlord/properties/new"
            className="group p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-teal-500/40 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 group-hover:text-amber-700 transition-colors">
              List New Unit →
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Add a new apartment, flat, or residential home to EstateFlow with photos and address details.
            </p>
          </Link>

          <Link
            href="/landlord/profile"
            className="group p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-teal-500/40 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
              Landlord Profile →
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Update company details, business registration number, contact credentials, and bio.
            </p>
          </Link>
        </div>

        {/* Recent Properties Section */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your Property Listings</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of listings currently synchronized with your backend
              </p>
            </div>
            <Link
              href="/landlord/properties"
              className="text-xs font-semibold text-teal-700 hover:text-teal-800"
            >
              View all ({properties.length})
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Loading properties...
            </div>
          ) : properties.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500 text-sm">No properties listed yet.</p>
              <Link
                href="/landlord/properties/new"
                className="mt-3 inline-block text-sm font-semibold text-teal-700 hover:underline"
              >
                + Add your first property
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {properties.slice(0, 5).map((property) => (
                <div
                  key={property.id}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-xl bg-cover bg-center shrink-0 border border-slate-200"
                      style={{ backgroundImage: `url(${property.image_url})` }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900 text-sm sm:text-base">
                          {property.name}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            property.is_available
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {property.is_available ? "Available" : "Occupied"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {property.house_number} {property.street_address}, {property.suburb || property.town}, {property.province}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>{property.bedrooms} Bed</span>
                        <span>•</span>
                        <span>{property.bathrooms} Bath</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-900">
                          ${property.price?.toLocaleString()}/mo
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link
                      href={`/properties/${property.id}`}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-white hover:border-slate-300"
                    >
                      View
                    </Link>
                    <Link
                      href={`/landlord/properties/${property.id}/edit`}
                      className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
