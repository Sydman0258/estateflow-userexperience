"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const path = usePathname();
  const isForecast = (path ?? "").startsWith("/forecast");
  return (
    <nav className="nav">
      <Link href="/" className="nav__logo">
        SB
      </Link>
      <ul className="nav__links">
        <li>
          <Link href="/">Home</Link>
        </li>
        <li>
          <Link href="/#projects">Projects</Link>
        </li>
        <li>
          <Link href="/#about">About</Link>
        </li>
        <li>
          <Link href="/forecast" className={isForecast ? "nav__cta" : undefined}>
            NBA Model
          </Link>
        </li>
        <li>
          <Link href="/#contact">Contact</Link>
        </li>
      </ul>
    </nav>
  );
}
