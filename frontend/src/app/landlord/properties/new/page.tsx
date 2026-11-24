"use client";

import Header from "@/components/Header";
import { createProperty, PropertyInput } from "@/lib/api";
import { getStoredTokens, isAuthenticated, isLandlord } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<PropertyInput>({
    name: "",
    house_number: "",
    street_address: "",
    suburb: "",
    town: "",
    district: "",
    province: "",
    price: 2000,
    bedrooms: 2,
    bathrooms: 1,
    is_available: true,
    description: "",
  });

  function updateField<K extends keyof PropertyInput>(field: K, value: PropertyInput[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const tokens = getStoredTokens();
      if (!tokens.access) {
        throw new Error("You must be signed in as a landlord to create a property listing.");
      }

      await createProperty(form, tokens.access);
      router.push("/landlord/properties");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create property.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      <div className="max-w-[800px] mx-auto px-5 sm:px-8 py-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <Link href="/landlord/dashboard" className="hover:text-slate-900">
            Landlord Portal
          </Link>
          <span>/</span>
          <Link href="/landlord/properties" className="hover:text-slate-900">
            Properties
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-medium">Add New Property</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
          <div className="pb-6 border-b border-slate-100">
            <h1 className="text-2xl font-bold text-slate-900">List a New Property</h1>
            <p className="text-slate-500 text-sm mt-1">
              Provide accurate location, specifications, and monthly rental pricing for your unit.
            </p>
          </div>

          {error && (
            <div className="my-6 p-4 rounded-xl bg-red-50 text-red-700 border border-red-100 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">
                1. General Property Info
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Listing Title / Property Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Modern Baluwatar Apartment with Terrace"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe amenities, proximity to transit, sunlight, furnishing details..."
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Location & Address */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">
                2. Location & Address
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    House / Flat Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 14A"
                    value={form.house_number}
                    onChange={(e) => updateField("house_number", e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gairidhara Marg"
                    value={form.street_address}
                    onChange={(e) => updateField("street_address", e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Suburb / Tol *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Baluwatar"
                    value={form.suburb}
                    onChange={(e) => updateField("suburb", e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Town / Municipality *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kathmandu"
                    value={form.town}
                    onChange={(e) => updateField("town", e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    District *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kathmandu"
                    value={form.district}
                    onChange={(e) => updateField("district", e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Province / State *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bagmati"
                    value={form.province}
                    onChange={(e) => updateField("province", e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Specifications */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">
                3. Rent & Specifications
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Monthly Rent ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.price}
                    onChange={(e) => updateField("price", Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Bedrooms *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={20}
                    value={form.bedrooms}
                    onChange={(e) => updateField("bedrooms", Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Bathrooms *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={20}
                    value={form.bathrooms}
                    onChange={(e) => updateField("bathrooms", Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-900"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_available}
                    onChange={(e) => updateField("is_available", e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium text-slate-800">
                    Immediately available for tenant discovery & booking
                  </span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link
                href="/landlord/properties"
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? "Publishing listing..." : "Publish Property"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
