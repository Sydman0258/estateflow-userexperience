"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/forecast", label: "Overview", exact: true },
  { href: "/forecast/players", label: "Players" },
  { href: "/forecast/teams", label: "Teams" },
  { href: "/forecast/leaders", label: "Leaders" },
  { href: "/forecast/evaluation", label: "Evaluation" },
  { href: "/forecast/about", label: "Method" },
];

export default function SubNav() {
  const path = usePathname() || "";
  return (
    <nav className="subnav" aria-label="NBA model sections">
      {ITEMS.map((i) => {
        const active = i.exact ? path === i.href : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} className={active ? "is-active" : undefined}>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
