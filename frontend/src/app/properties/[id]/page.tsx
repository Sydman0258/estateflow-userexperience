import Header from "@/components/Header";
import { fetchProperties } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

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

  let property = STATIC[id] || null;

  if (!property) {
    const all = await fetchProperties();
    const found = all.find((p) => String(p.id) === id);
    if (found) {
      property = {
        name: found.name,
        price: found.price_display || `$${found.price.toLocaleString()}/mo`,
        location: found.location || `${found.suburb}, ${found.town}, ${found.province}`,
        tags: [
          found.bedrooms === 0 ? "Studio" : `${found.bedrooms} Bed`,
          `${found.bathrooms} Bath`,
          "Furnished",
        ],
        image: found.image_url,
        description:
          found.description ||
          "A well-maintained property listed directly by a verified landlord.",
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

            <button className="bg-[#0f766e] hover:bg-[#0d5f59] text-white font-semibold px-8 py-3 rounded-xl transition-colors">
              Request dates
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
