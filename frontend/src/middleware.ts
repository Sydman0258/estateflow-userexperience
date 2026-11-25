import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Baseline browser hardening for every page.
 *
 * Deliberately NOT included: a strict script-src / form-action CSP. Next.js needs nonces for that,
 * and a form-action allow-list would also block the redirect chain back from eSewa's payment page.
 * Tighten these before a production launch (see docs/PAYMENTS_AND_SECURITY.md).
 */
export function middleware(_req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // Clickjacking protection, <base> hijacking and plugin content are blocked without touching scripts/forms.
  res.headers.set("Content-Security-Policy", "frame-ancestors 'none'; base-uri 'self'; object-src 'none'");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
