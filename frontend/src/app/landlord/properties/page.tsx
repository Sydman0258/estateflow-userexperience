"use client";

import Header from "@/components/Header";
import { deleteProperty, fetchProperties, Property, updateProperty } from "@/lib/api";
import { getStoredTokens } from "@/lib/auth";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandlordPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "available" | "occupied">("all");
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const data = await fetchProperties({ available: undefined });
      setProperties(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleToggleAvailability(property: Property) {
    setActionError("");
    try {
      const tokens = getStoredTokens();
      await updateProperty(
        property.id,
        { is_available: !property.is_available },
        tokens.access
      );
      setProperties((prev) =>
        prev.map((p) =>
          p.id === property.id ? { ...p, is_available: !p.is_available } : p
        )
      );
    } catch (err: unknown) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Failed to update property status. Please ensure you are logged in as the property owner."
      );
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this property listing? This cannot be undone.")) {
      return;
    }
    setActionError("");
    try {
      const tokens = getStoredTokens();
      await deleteProperty(id, tokens.access);
      setProperties((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Failed to delete property. Check authorization."
      );
    }
  }

  const filteredProperties = properties.filter((p) => {
    const matchesFilter =
      filter === "all"
        ? true
        : filter === "available"
        ? p.is_available
        : !p.is_available;

    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.street_address?.toLowerCase().includes(search.toLowerCase()) ||
      p.town?.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      <div className="max-w-[1120px] mx-auto px-5 sm:px-8 py-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <Link href="/landlord/dashboard" className="hover:text-slate-900">
            Landlord Portal
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-medium">My Properties</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Property Listings
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage your residential units, rates, and occupancy status.
            </p>
          </div>
          <Link
            href="/landlord/properties/new"
            className="bg-teal-700 hover:bg-teal-800 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm inline-flex items-center gap-2 self-start sm:self-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add property
          </Link>
        </div>

        {actionError && (
          <div className="my-4 p-4 rounded-xl bg-red-50 text-red-700 border border-red-100 text-sm">
            {actionError}
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 my-6">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === "all"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({properties.length})
            </button>
            <button
              onClick={() => setFilter("available")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === "available"
                  ? "bg-white text-teal-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Available ({properties.filter((p) => p.is_available).length})
            </button>
            <button
              onClick={() => setFilter("occupied")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === "occupied"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Occupied ({properties.filter((p) => !p.is_available).length})
            </button>
          </div>

          <div className="relative sm:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search properties..."
              className="w-full text-sm bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Listings Table / Cards */}
        {loading ? (
          <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-100">
            Loading your property listings...
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-100">
            <p className="text-slate-600 font-medium">No properties match your filter</p>
            <p className="text-xs text-slate-400 mt-1">
              Try searching for something else or add a new property listing.
            </p>
            <Link
              href="/landlord/properties/new"
              className="mt-4 inline-block bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-medium"
            >
              Add Property
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filteredProperties.map((p) => (
                <div
                  key={p.id}
                  className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div
                      className="w-20 h-20 rounded-xl bg-cover bg-center shrink-0 border border-slate-200"
                      style={{ backgroundImage: `url(${p.image_url})` }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">{p.name}</h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            p.is_available
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {p.is_available ? "Available" : "Occupied"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {p.house_number} {p.street_address}, {p.suburb || p.town}, {p.district}, {p.province}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                        <span className="font-semibold text-slate-900 text-sm">
                          ${p.price?.toLocaleString()}/month
                        </span>
                        <span>•</span>
                        <span>{p.bedrooms} Beds</span>
                        <span>•</span>
                        <span>{p.bathrooms} Baths</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleAvailability(p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        p.is_available
                          ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                          : "border-teal-200 text-teal-700 hover:bg-teal-50"
                      }`}
                    >
                      Mark {p.is_available ? "Occupied" : "Available"}
                    </button>
                    <Link
                      href={`/properties/${p.id}`}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Public page
                    </Link>
                    <Link
                      href={`/landlord/properties/${p.id}/edit`}
                      className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete property"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
