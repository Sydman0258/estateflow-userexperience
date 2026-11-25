import Facade from "@/components/home/Facade";
import HomeNav from "@/components/home/HomeNav";
import ListingCard, { type Home } from "@/components/home/ListingCard";
import MoveInCost from "@/components/home/MoveInCost";
import { API_BASE, type Property } from "@/lib/api";
import Link from "next/link";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brick";

const FIELD =
  "w-full appearance-none rounded-xl border border-ink/15 bg-snow px-3.5 py-3 text-[15px] font-medium text-ink placeholder:font-normal placeholder:text-graphite/70 focus:border-brick focus:outline-none focus:ring-2 focus:ring-brick/25";

const CHEVRON = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234a5568' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
} as const;

/**
 * Starting rents per neighbourhood. These are sample figures: replace them with an
 * aggregate from the API (min price grouped by town) once enough listings exist.
 */
const AREAS = [
  {
    area: "Jhamsikhel",
    city: "Lalitpur",
    note: "Roasteries, galleries and quiet brick lanes.",
    from: 68000,
  },
  {
    area: "Lazimpat",
    city: "Kathmandu",
    note: "Embassy quarter, coworking floors and rooftop cafés.",
    from: 74000,
  },
  {
    area: "Lakeside",
    city: "Pokhara",
    note: "Phewa Lake at the door and the Annapurnas beyond it.",
    from: 58000,
  },
];

/** Shown only while the API has no available listings. They link to search, not to a detail page. */
const SAMPLE_HOMES: Home[] = [
  {
    id: "sample-patan",
    href: "/browse?location=Lalitpur",
    name: "Patan Courtyard",
    location: "Jhamsikhel, Lalitpur",
    beds: "Studio, 1 bath, furnished",
    price: "NPR 68,000/mo",
    available: true,
  },
  {
    id: "sample-lazimpat",
    href: "/browse?location=Kathmandu",
    name: "Lazimpat House",
    location: "Lazimpat, Kathmandu",
    beds: "1 bed, 1 bath, furnished",
    price: "NPR 74,000/mo",
    available: true,
  },
  {
    id: "sample-fewa",
    href: "/browse?location=Pokhara",
    name: "Fewa Terraces",
    location: "Lakeside, Pokhara",
    beds: "1 bed, 1 bath, furnished",
    price: "NPR 58,000/mo",
    available: true,
  },
];

async function getHomes(): Promise<Home[]> {
  try {
    const res = await fetch(`${API_BASE}/properties/`, { cache: "no-store" });
    if (!res.ok) throw new Error("bad status");
    const data = await res.json();
    const list: Property[] = Array.isArray(data) ? data : data.results || [];
    const open = list.filter((p) => p.is_available).slice(0, 3);
    if (open.length > 0) {
      return open.map((p) => ({
        id: p.id,
        href: `/properties/${p.id}`,
        name: p.name,
        location: p.location || [p.suburb, p.town].filter(Boolean).join(", "),
        beds: `${p.bedrooms === 0 ? "Studio" : `${p.bedrooms} bed`}, ${p.bathrooms} bath`,
        price: p.price_display || `NPR ${p.price.toLocaleString("en-IN")}/mo`,
        available: p.is_available,
        image: p.image_url || undefined,
      }));
    }
  } catch {
    /* fall through to samples */
  }
  return SAMPLE_HOMES;
}

const STEPS = [
  {
    title: "Find a home",
    body: "Search by area and monthly rent. Every listing shows the full rent in NPR, with no broker on top.",
  },
  {
    title: "Send an application",
    body: "Choose your move-in date and write to the landlord. It costs nothing to apply.",
  },
  {
    title: "Pay once you're accepted",
    body: "When the landlord says yes, pay the deposit and first month with eSewa or card.",
  },
];

const TRUST = [
  {
    title: "Landlords are verified",
    body: "Each listing belongs to a landlord account that has been checked, and you can read reviews from past tenants.",
  },
  {
    title: "Two-step login when you want it",
    body: "Turn it on from Settings. It stays off until you do.",
  },
  {
    title: "One payment history",
    body: "Rent and deposits are recorded on your dashboard, so tenant and landlord see the same figures.",
  },
];

function Arrow({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m0 0l-6-6m6 6l-6 6" />
    </svg>
  );
}

export default async function HomePage() {
  const homes = await getHomes();
  const [lead, ...rest] = homes;

  return (
    <div className="flex min-h-screen flex-col bg-snow font-body text-ink">
      <HomeNav />

      <main className="flex-1">
        {/* ───────── Hero ───────── */}
        <section className="mx-auto grid max-w-[1200px] gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-16 lg:pb-28 lg:pt-16">
          <div>
            <h1 className="font-display text-[clamp(2.5rem,6.2vw,4.9rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-balance">
              Rent a home in Nepal. Pay the owner, not a broker.
            </h1>
            <p className="mt-6 max-w-[52ch] text-[18px] leading-[1.6] text-graphite">
              Monthly rentals in Kathmandu, Lalitpur and Pokhara, listed directly by
              verified landlords. Prices are in NPR, and you pay only after your
              application is accepted.
            </p>

            <form
              action="/browse"
              method="get"
              className="mt-9 grid gap-4 rounded-[22px] bg-white p-4 shadow-[0_24px_48px_-28px_rgba(14,27,51,0.45)] ring-1 ring-ink/10 sm:grid-cols-2 sm:p-5"
            >
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-[14px] font-semibold">Where do you want to live?</span>
                <input
                  type="text"
                  name="location"
                  list="areas"
                  autoComplete="off"
                  placeholder="Kathmandu, Lalitpur, Pokhara"
                  className={FIELD}
                />
                <datalist id="areas">
                  <option value="Kathmandu" />
                  <option value="Lalitpur" />
                  <option value="Pokhara" />
                  <option value="Bhaktapur" />
                  <option value="Jhamsikhel" />
                  <option value="Lazimpat" />
                  <option value="Lakeside" />
                </datalist>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[14px] font-semibold">Home type</span>
                <select name="type" defaultValue="" className={FIELD} style={CHEVRON}>
                  <option value="">Any type</option>
                  <option value="studio">Studio</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[14px] font-semibold">Most you&apos;ll pay a month</span>
                <select name="max" defaultValue="" className={FIELD} style={CHEVRON}>
                  <option value="">No limit</option>
                  <option value="30000">NPR 30,000</option>
                  <option value="50000">NPR 50,000</option>
                  <option value="75000">NPR 75,000</option>
                  <option value="100000">NPR 1,00,000</option>
                  <option value="150000">NPR 1,50,000</option>
                </select>
              </label>

              <button
                type="submit"
                className={`inline-flex items-center justify-center gap-2 rounded-xl bg-brick px-6 py-3.5 text-[16px] font-semibold text-white transition-colors hover:bg-brick-deep sm:col-span-2 ${FOCUS}`}
              >
                Show homes
                <Arrow className="h-5 w-5" />
              </button>
            </form>
            <p className="mt-4 text-[14px] text-graphite">
              Leave the fields empty to see every verified listing.
            </p>
          </div>

          <figure className="mx-auto w-full max-w-[460px] lg:max-w-none">
            <div className="aspect-[520/640] overflow-hidden rounded-t-[999px] rounded-b-[28px] bg-ink shadow-[0_40px_70px_-40px_rgba(14,27,51,0.7)]">
              <Facade />
            </div>
            <figcaption className="mt-3 text-[13px] text-graphite">
              Drawn after the brick-and-timber houses of Patan. ghar (घर) means home.
            </figcaption>
          </figure>
        </section>

        {/* ───────── Neighbourhoods ───────── */}
        <section id="areas" className="border-t border-ink/10">
          <div className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8 lg:py-24">
            <h2 className="max-w-[18ch] font-display text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-balance">
              Start with the neighbourhood
            </h2>
            <p className="mt-4 max-w-[56ch] text-[17px] leading-relaxed text-graphite">
              Three places where renters ask for us most. Pick one and see what is open.
            </p>

            <ul className="mt-10 border-t border-ink">
              {AREAS.map((a) => (
                <li key={a.area} className="border-b border-ink/20">
                  <Link
                    href={`/browse?location=${encodeURIComponent(a.city)}`}
                    className={`group grid items-center gap-x-10 gap-y-2 px-3 py-7 transition-colors duration-150 hover:bg-ink hover:text-snow focus-visible:bg-ink focus-visible:text-snow md:grid-cols-[1.1fr_1.3fr_auto_auto] ${FOCUS}`}
                  >
                    <span className="font-display text-[clamp(2.2rem,5vw,3.75rem)] font-semibold leading-none tracking-[-0.03em]">
                      {a.area}
                    </span>
                    <span className="text-[16px] leading-snug text-graphite transition-colors group-hover:text-mist group-focus-visible:text-mist">
                      <span className="font-semibold text-ink transition-colors group-hover:text-snow group-focus-visible:text-snow">
                        {a.city}.
                      </span>{" "}
                      {a.note}
                    </span>
                    <span className="text-[16px] font-semibold tabular-nums text-brick transition-colors group-hover:text-marigold group-focus-visible:text-marigold">
                      From NPR {a.from.toLocaleString("en-IN")} a month
                    </span>
                    <Arrow className="hidden h-6 w-6 transition-transform group-hover:translate-x-1 md:block" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ───────── Newly listed ───────── */}
        <section id="homes" className="border-y border-ink/10 bg-white">
          <div className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8 lg:py-24">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.02em]">
                Newly listed
              </h2>
              <Link
                href="/browse"
                className={`inline-flex items-center gap-2 rounded-md text-[16px] font-semibold text-brick underline-offset-4 hover:underline ${FOCUS}`}
              >
                See all homes
                <Arrow className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <ListingCard home={lead} featured />
              </div>
              <div className="flex flex-col gap-6 lg:col-span-5">
                {rest.map((h) => (
                  <ListingCard key={h.id} home={h} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ───────── Move-in cost ───────── */}
        <section id="cost" className="bg-ink text-snow">
          <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:py-24">
            <div>
              <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-balance">
                Know what move-in costs before you apply
              </h2>
              <p className="mt-5 max-w-[48ch] text-[17px] leading-relaxed text-mist">
                Move-in is the first month&apos;s rent plus a one-month deposit. Nothing is added
                for a broker, because there isn&apos;t one. Drag the slider to try your budget.
              </p>
              <Link
                href="/browse"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-marigold px-6 py-3 text-[15px] font-semibold text-ink transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marigold"
              >
                Find a home in your range
              </Link>
            </div>
            <MoveInCost />
          </div>
        </section>

        {/* ───────── How it works ───────── */}
        <section id="how" className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8 lg:py-24">
          <h2 className="max-w-[20ch] font-display text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-balance">
            Three steps from search to keys
          </h2>

          <ol className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            <span
              aria-hidden="true"
              className="absolute left-5 top-5 hidden h-px w-[calc(100%-2.5rem)] bg-ink/20 md:block"
            />
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative flex gap-5 md:block">
                <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brick font-display text-[17px] font-semibold text-white ring-8 ring-snow">
                  {i + 1}
                </span>
                <div className="md:mt-6">
                  <h3 className="font-display text-[22px] font-semibold leading-tight">{s.title}</h3>
                  <p className="mt-2 max-w-[38ch] text-[16px] leading-relaxed text-graphite">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ───────── Trust ───────── */}
        <section id="trust" className="border-y border-ink/10 bg-mist/50">
          <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-20">
            <h2 className="max-w-[22ch] font-display text-[clamp(1.7rem,3.4vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-balance">
              Made so renters and owners can both check the other side
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3 md:gap-0 md:divide-x md:divide-ink/20">
              {TRUST.map((t) => (
                <div key={t.title} className="md:px-8 md:first:pl-0 md:last:pr-0">
                  <h3 className="font-display text-[20px] font-semibold leading-tight">{t.title}</h3>
                  <p className="mt-2 max-w-[36ch] text-[16px] leading-relaxed text-graphite">
                    {t.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── Landlords ───────── */}
        <section className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8 lg:py-24">
          <div className="grid items-center gap-8 rounded-[32px] bg-brick px-7 py-12 text-white sm:px-12 lg:grid-cols-[1.4fr_1fr] lg:py-14">
            <div>
              <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-balance">
                Own a home in Nepal? Rent it out directly.
              </h2>
              <p className="mt-4 max-w-[50ch] text-[17px] leading-relaxed text-white/90">
                List your space in under 10 minutes, review tenants who apply, and follow
                every monthly payment from one dashboard.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
              <Link
                href="/auth/register/landlord"
                className="inline-flex items-center justify-center rounded-full bg-snow px-6 py-3.5 text-[15px] font-semibold text-ink transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Create a landlord account
              </Link>
              <Link
                href="/list"
                className="inline-flex items-center justify-center rounded-full border border-white/60 px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                See how listing works
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ───────── Footer ───────── */}
      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-5 py-8 text-[14px] text-graphite sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            <span className="font-display text-[17px] font-semibold text-ink">EstateFlow</span>{" "}
            Monthly rentals in Nepal, listed directly by landlords.
          </p>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/privacy" className={`rounded-sm hover:text-ink ${FOCUS}`}>
              Privacy
            </Link>
            <Link href="/terms" className={`rounded-sm hover:text-ink ${FOCUS}`}>
              Terms
            </Link>
            <Link href="/support" className={`rounded-sm hover:text-ink ${FOCUS}`}>
              Support
            </Link>
            <span>© {new Date().getFullYear()} EstateFlow</span>
          </nav>
        </div>
      </footer>
    </div>
  );
}
