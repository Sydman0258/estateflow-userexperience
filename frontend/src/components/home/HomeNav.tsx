"use client";

import { AuthUser, getStoredTokens, getStoredUser, logoutUser } from "@/lib/auth";
import Link from "next/link";
import { useEffect, useState } from "react";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brick";

export default function HomeNav() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    function syncAuth() {
      setUser(getStoredUser());
      setIsAuth(!!getStoredTokens().access);
    }
    syncAuth();
    window.addEventListener("estateflow_auth_change", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("estateflow_auth_change", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  const dashboard =
    user?.role === "LANDLORD"
      ? { href: "/landlord/dashboard", label: "Dashboard" }
      : user?.role === "TENANT"
        ? { href: "/tenant/dashboard", label: "Dashboard" }
        : null;

  const link = `rounded-md px-1 py-1 text-[15px] font-medium text-graphite transition-colors hover:text-ink ${FOCUS}`;

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-snow/90 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-[1200px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className={`flex items-center gap-2.5 rounded-md ${FOCUS}`}>
          {/* A brick with one lit window */}
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-[9px] bg-brick"
          >
            <span className="h-3.5 w-2.5 rounded-[2px] bg-marigold" />
          </span>
          <span className="font-display text-[21px] font-semibold tracking-tight text-ink">
            EstateFlow
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          <Link href="/browse" className={link}>
            Browse homes
          </Link>
          <Link href="/list" className={link}>
            List a property
          </Link>
          <Link href="/support" className={link}>
            Support
          </Link>

          {isAuth ? (
            <div className="flex items-center gap-5 border-l border-ink/15 pl-6">
              {dashboard && (
                <Link href={dashboard.href} className={link}>
                  {dashboard.label}
                </Link>
              )}
              <Link href="/settings" className={link}>
                Settings
              </Link>
              <button
                type="button"
                onClick={() => logoutUser()}
                className={`rounded-full bg-ink px-4 py-2 text-[14px] font-semibold text-snow transition-colors hover:bg-brick ${FOCUS}`}
              >
                Sign out{user?.first_name ? `, ${user.first_name}` : ""}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-5 border-l border-ink/15 pl-6">
              <Link href="/auth/login" className={link}>
                Sign in
              </Link>
              <Link
                href="/auth/register/tenant"
                className={`rounded-full bg-ink px-4 py-2 text-[14px] font-semibold text-snow transition-colors hover:bg-brick ${FOCUS}`}
              >
                Create account
              </Link>
            </div>
          )}
        </nav>

        <button
          type="button"
          className={`-mr-2 rounded-lg p-2 text-ink md:hidden ${FOCUS}`}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="home-mobile-menu"
          onClick={() => setOpen(!open)}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav
          id="home-mobile-menu"
          aria-label="Mobile"
          className="border-t border-ink/10 bg-snow px-5 pb-5 pt-3 md:hidden"
        >
          <ul className="flex flex-col text-[16px] font-medium text-ink">
            {[
              { href: "/browse", label: "Browse homes" },
              { href: "/list", label: "List a property" },
              { href: "/support", label: "Support" },
              ...(isAuth && dashboard ? [dashboard] : []),
              ...(isAuth ? [{ href: "/settings", label: "Settings" }] : []),
            ].map((i) => (
              <li key={i.href}>
                <Link
                  href={i.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-ink/10 py-3"
                >
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            {isAuth ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  logoutUser();
                }}
                className="rounded-full bg-ink px-5 py-3 text-[15px] font-semibold text-snow"
              >
                Sign out
              </button>
            ) : (
              <>
                <Link
                  href="/auth/register/tenant"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-ink px-5 py-3 text-center text-[15px] font-semibold text-snow"
                >
                  Create a tenant account
                </Link>
                <Link
                  href="/auth/login"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-ink/25 px-5 py-3 text-center text-[15px] font-semibold text-ink"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
