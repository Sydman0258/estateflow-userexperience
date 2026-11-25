import Header from "@/components/Header";
import { API_BASE, fetchProperties, Property } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

/** Strict lookup: no demo fallback, so only real server listings are payable. */
async function fetchReal(id: string): Promise<Property | null> {
  try {
    const res = await fetch(`${API_BASE}/properties/${encodeURIComponent(id)}/`, { cache: "no-store" });
    return res.ok ? ((await res.json()) as Property) : null;
  } catch {
    return null;
  }
}

const STATIC: Record<
  string,
  {
    name: string;
    price: string;
    location: string;
    tags: string[];
    image: string;
    description: string;
  }
> = {
  "1": {
    name: "The Atlantic Studio Loft",
    price: "$2,450/mo",
    location: "Cobble Hill, Brooklyn, NY",
    tags: ["1 Bed", "1 Bath", "Furnished"],
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=85",
    description:
      "Bright loft with industrial charm in the heart of Cobble Hill. Fully furnished with high ceilings, exposed brick, and a dedicated workspace.",
  },
  "2": {
    name: "SOMA Creative Residence",
    price: "$2,200/mo",
    location: "SoMa, San Francisco, CA",
    tags: ["Studio", "1 Bath", "Utilities Inc."],
    image:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=85",
    description:
      "Modern open-plan living in SoMa with floor-to-ceiling windows. Utilities included. Ideal for creatives and remote workers.",
  },
  "3": {
    name: "Brownstone Garden Flat",
    price: "$2,500/mo",
    location: "Lincoln Park, Chicago, IL",
    tags: ["1 Bed", "1 Bath", "Private Patio"],
    image:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=85",
    description:
      "Charming garden-level flat in a classic Lincoln Park brownstone. Private patio, quiet street, and steps from the park.",
  },
};

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Real listings always win over the demo placeholders, so what a tenant sees
  // (and pays for) is exactly what is stored on the server.
  const real = await fetchReal(id);
  let property = real
    ? {
        name: real.name,
        price: real.price_display || `Rs. ${real.price.toLocaleString("en-IN")}/mo`,
        location: real.location || `${real.suburb}, ${real.town}, ${real.province}`,
        tags: [
          real.bedrooms === 0 ? "Studio" : `${real.bedrooms} Bed`,
          `${real.bathrooms} Bath`,
          real.is_available ? "Available" : "Currently let",
        ],
        image: real.image_url,
        description:
          real.description || "A well-maintained property listed directly by a verified landlord.",
      }
    : STATIC[id] || null;
  const payable = !!real;

  if (!property) {
    const all = await fetchProperties();
    const found = all.find((p) => String(p.id) === id);
    if (found) {
      property = {
        name: found.name,
        price: found.price_display || `Rs. ${found.price.toLocaleString("en-IN")}/mo`,
        location: found.location || `${found.suburb}, ${found.town}, ${found.province}`,
        tags: [found.bedrooms === 0 ? "Studio" : `${found.bedrooms} Bed`, `${found.bathrooms} Bath`],
        image: found.image_url,
        description: found.description || "A well-maintained property listed directly by a verified landlord.",
      };
    }
  }

  if (!property) notFound();

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-10">
        <Link
          href="/browse"
          className="text-sm text-slate-500 hover:text-slate-800 mb-6 inline-block"
        >
          ← Back to browse
        </Link>

        <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
          <div className="relative aspect-[16/9]">
            <Image
              src={property.image}
              alt={property.name}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {property.name}
                </h1>
                <p className="text-slate-500 mt-1">{property.location}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">{property.price}</p>
                <p className="text-sm text-slate-500">per month</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-slate-600 mb-6 pb-6 border-b border-slate-100">
              {property.tags.map((t) => (
                <span key={t} className="bg-slate-50 px-3 py-1 rounded-full">
                  {t}
                </span>
              ))}
            </div>

            <p className="text-slate-700 leading-relaxed mb-8">
              {property.description}
            </p>

            <div className="flex flex-wrap gap-3">
              {payable && (
                <Link
                  href={`/tenant/payments/new?property=${id}`}
                  className="bg-[#0f766e] hover:bg-[#0d5f59] text-white font-semibold px-8 py-3 rounded-xl transition-colors"
                >
                  Pay rent or deposit
                </Link>
              )}
              <button
                className={
                  payable
                    ? "border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-8 py-3 rounded-xl transition-colors"
                    : "bg-[#0f766e] hover:bg-[#0d5f59] text-white font-semibold px-8 py-3 rounded-xl transition-colors"
                }
              >
                Request dates
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
