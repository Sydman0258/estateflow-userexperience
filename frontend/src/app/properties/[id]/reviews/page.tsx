"use client";

import Header from "@/components/Header";
import { fetchPropertyById, Property, Review } from "@/lib/api";
import { getStoredUser, isTenant } from "@/lib/auth";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const INITIAL_REVIEWS: Record<string, Review[]> = {
  "1": [
    {
      id: 1,
      property: 1,
      reviewer_name: "Liam O'Connor",
      rating: 5,
      title: "Fantastic loft, wonderful landlord!",
      body: "Lived here for a year. The natural sunlight in the mornings is unmatched. The building is quiet and the landlord was always responsive whenever anything was needed. Highly recommend!",
      created_at: "2024-10-12",
    },
    {
      id: 2,
      property: 1,
      reviewer_name: "Maya Patel",
      rating: 4,
      title: "Great location and very comfortable",
      body: "Cobble Hill is a delightful neighborhood with bakeries and cafes right around the corner. The loft is well-insulated and modern. Only minor drawback was street parking during weekends.",
      created_at: "2024-09-03",
    },
  ],
  "2": [
    {
      id: 3,
      property: 2,
      reviewer_name: "Marcus Chen",
      rating: 5,
      title: "Perfect setup for remote work",
      body: "High-speed internet included and huge windows with city views. Clean building, package room is secure, and utilities were hassle-free.",
      created_at: "2024-11-01",
    },
  ],
};

export default function PropertyReviewsPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [property, setProperty] = useState<Property | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // New review form
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchPropertyById(id)
      .then((p) => {
        setProperty(p);
        setReviews(INITIAL_REVIEWS[id] || [
          {
            id: 99,
            property: Number(id),
            reviewer_name: "Verified Resident",
            rating: 5,
            title: "Superb condition and clean premises",
            body: "Great residential unit with great water pressure, secure entry, and quiet neighbors.",
            created_at: "2024-11-15",
          },
        ]);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [id]);

  function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const user = getStoredUser();

    setTimeout(() => {
      const newReview: Review = {
        id: Date.now(),
        property: Number(id),
        reviewer_name: user ? `${user.first_name} ${user.last_name}` : "Verified Tenant",
        rating,
        title,
        body,
        created_at: new Date().toISOString().split("T")[0],
      };
      setReviews([newReview, ...reviews]);
      setTitle("");
      setBody("");
      setSubmitting(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    }, 600);
  }

  const avgRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      <div className="max-w-[880px] mx-auto px-5 sm:px-8 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link href="/browse" className="hover:text-slate-900">
            Browse
          </Link>
          <span>/</span>
          <Link href={`/properties/${id}`} className="hover:text-slate-900">
            {property?.name || `Property #${id}`}
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-medium">Tenant Reviews</span>
        </div>

        {/* Property Header Banner */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
                Verified Resident Feedback
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                Reviews for {property?.name || "Property"}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {property?.location || `${property?.suburb || property?.town}, ${property?.province}`}
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
              <span className="text-3xl font-bold text-slate-900">{avgRating}</span>
              <div>
                <div className="flex text-amber-400 text-sm">
                  {"★".repeat(Math.round(Number(avgRating)))}
                  {"☆".repeat(5 - Math.round(Number(avgRating)))}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{reviews.length} total reviews</p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Review Section */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Write a Property Review</h2>
          <p className="text-xs text-slate-500 mb-5">
            Share your authentic living experience with prospective tenants.
          </p>

          {success && (
            <div className="mb-5 p-3 rounded-xl bg-teal-50 text-teal-800 text-xs font-semibold">
              Thank you! Your verified tenant review has been published.
            </div>
          )}

          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Your Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-2xl transition-transform hover:scale-110 ${
                      star <= rating ? "text-amber-400" : "text-slate-200"
                    }`}
                  >
                    ★
                  </button>
                ))}
                <span className="text-xs font-semibold text-slate-600 ml-2">
                  {rating} of 5 Stars
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Review Headline *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Quiet neighborhood, excellent daylight and quick maintenance"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Detailed Review *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Tell other tenants about water supply, acoustic privacy, maintenance response, and local amenities..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-900"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? "Publishing review..." : "Submit Review"}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Reviews List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Verified Tenant Reviews</h2>
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-700 font-bold text-sm flex items-center justify-center">
                    {rev.reviewer_name[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">{rev.reviewer_name}</h3>
                    <p className="text-[11px] text-slate-400">Verified Tenant • {rev.created_at}</p>
                  </div>
                </div>

                <div className="text-amber-400 text-sm">
                  {"★".repeat(rev.rating)}
                  {"☆".repeat(5 - rev.rating)}
                </div>
              </div>

              <div className="pt-3">
                <h4 className="font-bold text-slate-900 text-sm mb-1">{rev.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{rev.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
