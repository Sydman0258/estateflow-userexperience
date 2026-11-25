import Link from "next/link";

export type Home = {
  id: number | string;
  href: string;
  name: string;
  location: string;
  beds: string;
  price: string;
  available: boolean;
  image?: string;
};

const TONES = [
  { sky: "#dde5ee", wall: "#b8402a", win: "#f4b63f", roof: "#3a1a12" },
  { sky: "#f4b63f", wall: "#0e1b33", win: "#f4b63f", roof: "#0e1b33" },
  { sky: "#0e1b33", wall: "#dde5ee", win: "#0e1b33", roof: "#b8402a" },
];

/** Flat architectural plate, used until a listing has a photo. */
function HousePlate({ seed }: { seed: number | string }) {
  const n =
    typeof seed === "number"
      ? seed
      : [...String(seed)].reduce((a, c) => a + c.charCodeAt(0), 0);
  const t = TONES[Math.abs(n) % TONES.length];
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className="block h-full w-full"
      aria-hidden="true"
    >
      <rect width="400" height="300" fill={t.sky} />
      <rect y="262" width="400" height="38" fill={t.roof} opacity=".18" />
      <polygon points="96,112 304,112 262,68 138,68" fill={t.roof} />
      <rect x="110" y="112" width="180" height="150" fill={t.wall} />
      {[0, 1].flatMap((r) =>
        [0, 1, 2].map((c) => (
          <rect
            key={`${r}-${c}`}
            x={128 + c * 52}
            y={128 + r * 62}
            width="34"
            height="42"
            rx="2"
            fill={t.win}
          />
        )),
      )}
    </svg>
  );
}

export default function ListingCard({
  home,
  featured = false,
}: {
  home: Home;
  featured?: boolean;
}) {
  return (
    <Link
      href={home.href}
      className={`group flex h-full overflow-hidden rounded-[22px] bg-snow ring-1 ring-ink/10 transition-shadow duration-300 hover:shadow-[0_18px_40px_-22px_rgba(14,27,51,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brick ${
        featured ? "flex-col" : "flex-col sm:flex-row"
      }`}
    >
      <div
        className={`overflow-hidden bg-mist ${
          featured ? "aspect-[16/10]" : "aspect-[4/3] sm:aspect-auto sm:w-[42%] sm:shrink-0"
        }`}
      >
        <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]">
          {home.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={home.image}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <HousePlate seed={home.id} />
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-5 p-6">
        <div>
          <div className="flex items-start justify-between gap-4">
            <h3
              className={`font-display font-semibold leading-tight text-ink ${
                featured ? "text-[26px]" : "text-[20px]"
              }`}
            >
              {home.name}
            </h3>
            <span className="shrink-0 pt-0.5 text-[16px] font-semibold tabular-nums text-brick">
              {home.price}
            </span>
          </div>
          <p className="mt-1.5 text-[15px] text-graphite">{home.location}</p>
          <p className="mt-1 text-[14px] text-graphite">{home.beds}</p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-ink/10 pt-4 text-[13.5px]">
          <span className="inline-flex items-center gap-1.5 font-medium text-ink">
            <svg viewBox="0 0 20 20" className="h-4 w-4 text-brick" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 1.5l1.9 1.4 2.4-.1.9 2.2 2 1.4-.6 2.3.6 2.3-2 1.4-.9 2.2-2.4-.1L10 16.9l-1.9-1.4-2.4.1-.9-2.2-2-1.4.6-2.3-.6-2.3 2-1.4.9-2.2 2.4.1L10 1.5zm3 6.2a.9.9 0 00-1.3-1.2L9 9.2 8.3 8.5a.9.9 0 10-1.3 1.2l1.4 1.4a.9.9 0 001.3 0L13 7.7z"
                clipRule="evenodd"
              />
            </svg>
            Verified landlord
          </span>
          <span className={home.available ? "font-medium text-ink" : "text-graphite"}>
            {home.available ? "Available now" : "Not available"}
          </span>
        </div>
      </div>
    </Link>
  );
}
