import Image from "next/image";
import Link from "next/link";

export type CardProperty = {
  id: number | string;
  name: string;
  price: string;
  availability: string;
  location: string;
  tags: string[];
  image: string;
};

type Props = {
  property: CardProperty;
};

export default function PropertyCard({ property }: Props) {
  return (
    <Link
      href={`/properties/${property.id}`}
      className="group block bg-white rounded-xl overflow-hidden border border-slate-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-shadow duration-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Image
          src={property.image}
          alt={property.name}
          fill
          className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <span className="absolute top-3 left-3 bg-white text-[11px] font-semibold text-slate-800 px-2.5 py-[5px] rounded-md shadow-sm tracking-tight">
          Verified Landlord
        </span>
      </div>

      <div className="p-4 pb-5">
        <div className="flex items-baseline justify-between gap-2 mb-1.5">
          <span className="text-[17px] font-bold text-slate-900 tracking-tight">
            {property.price}
          </span>
          <span className="text-[12px] font-medium text-slate-500">
            {property.availability}
          </span>
        </div>

        <h3 className="font-semibold text-[15px] text-slate-900 leading-snug mb-0.5">
          {property.name}
        </h3>
        <p className="text-[13px] text-slate-500 mb-3.5">{property.location}</p>

        <div className="flex flex-wrap items-center gap-x-0 text-[12px] text-slate-500 border-t border-slate-100 pt-3">
          {property.tags.map((tag, i) => (
            <span key={tag} className="flex items-center">
              {i > 0 && <span className="mx-2 text-slate-300">•</span>}
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
