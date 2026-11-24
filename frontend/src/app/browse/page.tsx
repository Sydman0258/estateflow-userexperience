import Header from "@/components/Header";
import PropertyCard, { type CardProperty } from "@/components/PropertyCard";
import { fetchProperties } from "@/lib/api";
import Link from "next/link";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string; max?: string; type?: string }>;
}) {
  const params = await searchParams;
  const apiProps = await fetchProperties({
    search: params.location,
  });

  const properties: CardProperty[] = apiProps.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price_display || `$${p.price.toLocaleString()}/mo`,
    availability: p.is_available ? "Available" : "Unavailable",
    location: p.location || `${p.suburb}, ${p.town}, ${p.province}`,
    tags: [
      p.bedrooms === 0 ? "Studio" : `${p.bedrooms} Bed`,
      `${p.bathrooms} Bath`,
      "Furnished",
    ],
    image: p.image_url,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      <Header />
      <main className="flex-1 max-w-[1120px] mx-auto px-5 sm:px-8 py-12 w-full">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-slate-800 mb-4 inline-block"
          >
            ← Back to home
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Browse homes
          </h1>
          <p className="text-slate-500 mt-1">
            {properties.length} verified listings available
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>

        {properties.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            No properties found. Try adjusting your filters.
          </div>
        )}
      </main>
    </div>
  );
}
