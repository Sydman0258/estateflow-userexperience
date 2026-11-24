"use client";

import Header from "@/components/Header";
import { deleteProperty, fetchPropertyById, PropertyInput, updateProperty } from "@/lib/api";
import { getStoredTokens } from "@/lib/auth";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<PropertyInput>({
    name: "",
    house_number: "",
    street_address: "",
    suburb: "",
    town: "",
    district: "",
    province: "",
    price: 0,
    bedrooms: 1,
    bathrooms: 1,
    is_available: true,
    description: "",
  });

  useEffect(() => {
    if (!id) return;
    fetchPropertyById(id)
      .then((prop) => {
        if (prop) {
          setForm({
            name: prop.name || "",
            house_number: prop.house_number || "",
            street_address: prop.street_address || "",
            suburb: prop.suburb || "",
            town: prop.town || "",
            district: prop.district || "",
            province: prop.province || "",
            price: prop.price || 0,
            bedrooms: prop.bedrooms ?? 1,
            bathrooms: prop.bathrooms ?? 1,
            is_available: prop.is_available ?? true,
            description: prop.description || "",
          });
        }
      })
      .catch((e) => setError("Failed to load property details."))
      .finally(() => setLoading(false));
  }, [id]);

  function updateField<K extends keyof PropertyInput>(field: K, value: PropertyInput[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError("");

    try {
      const tokens = getStoredTokens();
      await updateProperty(id, form, tokens.access);
      router.push("/landlord/properties");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update property. Ensure you are authorized as the owner."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!confirm("Are you sure you want to permanently delete this property?")) return;

    setSaving(true);
    try {
      const tokens = getStoredTokens();
      await deleteProperty(id, tokens.access);
      router.push("/landlord/properties");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete property.");
      setSaving(false);
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
          <span className="text-slate-900 font-medium">Edit Property #{id}</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Edit Property Details</h1>
              <p className="text-slate-500 text-sm mt-1">
                Update rental prices, address particulars, or change occupancy status.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors"
            >
              Delete property
            </button>
          </div>

          {error && (
            <div className="my-6 p-4 rounded-xl bg-red-50 text-red-700 border border-red-100 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Loading property information...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
              {/* General Info */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">
                  General Info
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Property Name *
                    </label>
                    <input
                      type="text"
                      required
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
                      value={form.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">
                  Location
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      House / Unit # *
                    </label>
                    <input
                      type="text"
                      required
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
                      value={form.province}
                      onChange={(e) => updateField("province", e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Amenities */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">
                  Pricing & Availability
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Monthly Price ($) *
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
                      Currently available for new tenants
                    </span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                <Link
                  href="/landlord/properties"
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
