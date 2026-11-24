import Header from "@/components/Header";
import PropertyCard, { type CardProperty } from "@/components/PropertyCard";
import Link from "next/link";

/** Exact featured homes from the design */
const FEATURED: CardProperty[] = [
  {
    id: 1,
    name: "The Atlantic Studio Loft",
    price: "$2,450/mo",
    availability: "Available now",
    location: "Cobble Hill, Brooklyn, NY",
    tags: ["1 Bed", "1 Bath", "Furnished"],
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=85",
  },
  {
    id: 2,
    name: "SOMA Creative Residence",
    price: "$2,200/mo",
    availability: "May 1st",
    location: "SoMa, San Francisco, CA",
    tags: ["Studio", "1 Bath", "Utilities Inc."],
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&q=85",
  },
  {
    id: 3,
    name: "Brownstone Garden Flat",
    price: "$2,500/mo",
    availability: "Flexible",
    location: "Lincoln Park, Chicago, IL",
    tags: ["1 Bed", "1 Bath", "Private Patio"],
    image:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&q=85",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      <Header />

      {/* ───────── Hero ───────── */}
      <section className="pt-14 sm:pt-20 pb-16 sm:pb-24">
        <div className="max-w-[1120px] mx-auto px-5 sm:px-8">
          <div className="max-w-[640px] mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.06em] text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-full mb-7">
              <span className="w-[6px] h-[6px] rounded-full bg-teal-500 shrink-0" />
              DIRECT MONTHLY LEASES
            </div>

            {/* Headline – exact wording & line break */}
            <h1 className="text-[2.15rem] sm:text-[2.75rem] lg:text-[3.15rem] font-bold tracking-[-0.025em] text-[#0f172a] leading-[1.12] mb-5">
              Monthly rentals directly
              <br />
              from verified landlords.
            </h1>

            <p className="text-[16px] sm:text-[17px] text-slate-500 max-w-[480px] mx-auto mb-10 leading-relaxed">
              Discover furnished homes with transparent pricing, zero broker
              markups, and simple monthly commitments.
            </p>

            {/* Search card – layout matches screenshot */}
            <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(15,23,42,0.06)] border border-slate-100 p-4 sm:p-5 text-left">
              <form action="/browse" method="get">
                {/* Top row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2.5">
                  <div className="flex flex-wrap items-center gap-2 text-[13.5px] text-slate-500 flex-1">
                    <span className="whitespace-nowrap">I&apos;m looking for</span>
                    <select
                      name="type"
                      defaultValue="apartment"
                      className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13.5px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 cursor-pointer pr-7"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 10px center",
                      }}
                    >
                      <option value="apartment">an apartment</option>
                      <option value="studio">a studio</option>
                      <option value="house">a house</option>
                    </select>
                    <span>in</span>
                    <input
                      type="text"
                      name="location"
                      defaultValue="New York, NY"
                      className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13.5px] font-medium text-slate-800 w-[118px] focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                    />
                    <span className="hidden sm:inline">under</span>
                  </div>

                  <button
                    type="submit"
                    className="bg-[#0f766e] hover:bg-[#0d5f59] text-white text-[14px] font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    Show homes
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>

                {/* Price row */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="sm:hidden text-[13.5px] text-slate-500">under</span>
                  <input
                    type="text"
                    name="max"
                    defaultValue="$2,500/mo"
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13.5px] font-medium text-slate-800 w-[110px] focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                </div>

                {/* Card footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3.5 pt-3.5 border-t border-slate-100 text-[12px] text-slate-400">
                  <span>Leave empty to browse all verified listings.</span>
                  <span className="flex items-center gap-1.5 text-teal-700 font-medium">
                    <span className="w-[6px] h-[6px] rounded-full bg-teal-500" />
                    No booking fees until accepted
                  </span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Curated collection ───────── */}
      <section className="pb-20">
        <div className="max-w-[1120px] mx-auto px-5 sm:px-8">
          <div className="flex items-end justify-between mb-7">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-400 uppercase mb-1">
                Curated Collection
              </p>
              <h2 className="text-[1.65rem] sm:text-[1.85rem] font-bold text-[#0f172a] tracking-[-0.02em]">
                Newly listed homes
              </h2>
            </div>
            <Link
              href="/browse"
              className="text-[13.5px] font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-0.5 mb-1"
            >
              See all 148 homes
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURED.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ───────── How a booking works ───────── */}
      <section className="py-16 sm:py-20 bg-white border-y border-slate-100">
        <div className="max-w-[1120px] mx-auto px-5 sm:px-8">
          <div className="max-w-[520px] mb-12">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-400 uppercase mb-2">
              Streamlined Booking
            </p>
            <h2 className="text-[1.65rem] sm:text-[1.85rem] font-bold text-[#0f172a] tracking-[-0.02em] mb-2.5">
              How a booking works
            </h2>
            <p className="text-[15px] text-slate-500 leading-relaxed">
              A predictable, transparent procedure built to replace legacy brokers and
              paper leases.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
            {[
              {
                num: "01",
                title: "1. Discover homes",
                body: "Filter by city, pricing, and move-in term. Every property features guaranteed all-inclusive monthly rates up front.",
              },
              {
                num: "02",
                title: "2. Request dates",
                body: "Select your exact check-in and departure windows. Review your complete summary with zero surprise fees or upfront charges.",
              },
              {
                num: "03",
                title: "3. Book directly",
                body: "Communicate with verified property owners directly. Pay securely only after your tenancy is officially accepted.",
              },
            ].map((step) => (
              <div key={step.num}>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-[12px] font-semibold text-slate-500 mb-4">
                  {step.num}
                </span>
                <h3 className="font-semibold text-[16px] text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-[14px] text-slate-500 leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Landlord CTA ───────── */}
      <section className="py-14 sm:py-16">
        <div className="max-w-[1120px] mx-auto px-5 sm:px-8">
          <div className="bg-[#0f2e2a] rounded-[20px] px-7 py-10 sm:px-12 sm:py-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-[480px]">
              <span className="inline-block text-[11px] font-semibold tracking-wide text-teal-200/90 bg-teal-900/50 px-3 py-1 rounded-full mb-4">
                For Owners & Hosts
              </span>
              <h2 className="text-[1.6rem] sm:text-[1.85rem] font-bold text-white tracking-[-0.02em] mb-2.5">
                Own a home to rent out?
              </h2>
              <p className="text-[15px] text-slate-300/90 leading-relaxed">
                List your space in under 10 minutes, screen qualified mid-term tenants,
                and manage monthly payouts with complete autonomy.
              </p>
            </div>
            <Link
              href="/auth/register/landlord"
              className="bg-white hover:bg-slate-50 text-slate-900 text-[14px] font-semibold px-6 py-3 rounded-xl transition-colors whitespace-nowrap shadow-lg"
            >
              Create a landlord account
            </Link>
          </div>
        </div>
      </section>

      {/* ───────── Footer ───────── */}
      <footer className="border-t border-slate-200/80 py-7 mt-auto">
        <div className="max-w-[1120px] mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-slate-400">
          <p>
            <span className="font-semibold text-slate-600">EstateFlow</span>
            {" "}— Monthly rentals, listed directly by landlords.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-slate-700 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-700 transition-colors">
              Terms
            </Link>
            <Link href="/support" className="hover:text-slate-700 transition-colors">
              Support
            </Link>
            <span>© 2025 EstateFlow Inc.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
