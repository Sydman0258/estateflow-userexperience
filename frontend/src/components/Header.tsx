"use client";

import { AuthUser, getStoredTokens, getStoredUser, logoutUser } from "@/lib/auth";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    function syncAuth() {
      const u = getStoredUser();
      const tokens = getStoredTokens();
      setUser(u);
      setIsAuth(!!tokens.access);
    }

    syncAuth();
    window.addEventListener("estateflow_auth_change", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("estateflow_auth_change", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100/80">
      <div className="max-w-[1120px] mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-[64px]">
          {/* Logo block */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex items-center gap-2">
              {/* Building mark */}
              <svg
                width="28"
                height="28"
                viewBox="0 0 32 32"
                fill="none"
                className="text-slate-900"
              >
                <path
                  d="M6 28V10l10-6 10 6v18H6z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  fill="none"
                />
                <path
                  d="M12 28V16h8v12"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  fill="none"
                />
                <path d="M14 20h4M14 24h4" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              <div className="flex flex-col leading-none -space-y-0.5">
                <span className="text-[9px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
                  Estateflow
                </span>
                <span className="text-[8px] font-medium tracking-[0.08em] text-slate-400 uppercase">
                  Since 2024
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              <span className="font-semibold text-[15px] text-slate-900 tracking-tight">
                EstateFlow
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/browse"
              className="text-[14px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              Browse homes
            </Link>

            {isAuth && user?.role === "LANDLORD" ? (
              <>
                <Link
                  href="/landlord/dashboard"
                  className="text-[14px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/landlord/properties"
                  className="text-[14px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                  My Properties
                </Link>
                <Link
                  href="/landlord/properties/new"
                  className="text-[14px] font-medium text-teal-700 hover:text-teal-800 transition-colors"
                >
                  + Add Property
                </Link>
              </>
            ) : isAuth && user?.role === "TENANT" ? (
              <>
                <Link
                  href="/tenant/dashboard"
                  className="text-[14px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/tenant/applications"
                  className="text-[14px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Applications
                </Link>
                <Link
                  href="/tenant/payments"
                  className="text-[14px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Payments
                </Link>
              </>
            ) : (
              <Link
                href="/list"
                className="text-[14px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                List a property
              </Link>
            )}

            {isAuth ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <Link
                  href={user?.role === "LANDLORD" ? "/landlord/profile" : "/tenant/profile"}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-teal-700 bg-slate-50 py-1.5 px-3 rounded-full border border-slate-200"
                >
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  {user?.first_name || "Profile"}
                </Link>
                <Link
                  href="/settings"
                  className="text-[13px] font-medium text-slate-500 hover:text-teal-700 transition-colors"
                >
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={() => logoutUser()}
                  className="text-[13px] font-medium text-slate-500 hover:text-red-600 transition-colors"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 pl-2">
                <Link
                  href="/auth/login"
                  className="text-[14px] font-semibold text-slate-900 hover:text-teal-700 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register/tenant"
                  className="text-xs font-semibold px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl transition-colors shadow-sm"
                >
                  Sign up
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu trigger */}
          <button
            className="md:hidden p-2 -mr-2 rounded-lg text-slate-600"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <div className="md:hidden pb-4 space-y-1 border-t border-slate-100 pt-3">
            <Link
              href="/browse"
              className="block px-2 py-2 text-sm font-medium text-slate-700"
              onClick={() => setOpen(false)}
            >
              Browse homes
            </Link>

            {isAuth && user?.role === "LANDLORD" ? (
              <>
                <Link
                  href="/landlord/dashboard"
                  className="block px-2 py-2 text-sm font-medium text-slate-700"
                  onClick={() => setOpen(false)}
                >
                  Landlord Dashboard
                </Link>
                <Link
                  href="/landlord/properties"
                  className="block px-2 py-2 text-sm font-medium text-slate-700"
                  onClick={() => setOpen(false)}
                >
                  My Properties
                </Link>
                <Link
                  href="/landlord/properties/new"
                  className="block px-2 py-2 text-sm font-medium text-teal-700 font-semibold"
                  onClick={() => setOpen(false)}
                >
                  + Add Property
                </Link>
                <Link
                  href="/landlord/profile"
                  className="block px-2 py-2 text-sm font-medium text-slate-700"
                  onClick={() => setOpen(false)}
                >
                  My Profile
                </Link>
              </>
            ) : isAuth && user?.role === "TENANT" ? (
              <>
                <Link
                  href="/tenant/dashboard"
                  className="block px-2 py-2 text-sm font-medium text-slate-700"
                  onClick={() => setOpen(false)}
                >
                  Tenant Dashboard
                </Link>
                <Link
                  href="/tenant/applications"
                  className="block px-2 py-2 text-sm font-medium text-slate-700"
                  onClick={() => setOpen(false)}
                >
                  My Applications
                </Link>
                <Link
                  href="/tenant/payments"
                  className="block px-2 py-2 text-sm font-medium text-slate-700"
                  onClick={() => setOpen(false)}
                >
                  Payments
                </Link>
                <Link
                  href="/tenant/profile"
                  className="block px-2 py-2 text-sm font-medium text-slate-700"
                  onClick={() => setOpen(false)}
                >
                  My Profile
                </Link>
              </>
            ) : (
              <Link
                href="/list"
                className="block px-2 py-2 text-sm font-medium text-slate-700"
                onClick={() => setOpen(false)}
              >
                List a property
              </Link>
            )}

            {isAuth && (
              <Link
                href="/settings"
                className="block px-2 py-2 text-sm font-medium text-slate-700"
                onClick={() => setOpen(false)}
              >
                Settings
              </Link>
            )}

            {isAuth ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  logoutUser();
                }}
                className="w-full text-left px-2 py-2 text-sm font-medium text-red-600"
              >
                Sign out ({user?.first_name || "User"})
              </button>
            ) : (
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <Link
                  href="/auth/login"
                  className="block px-2 py-2 text-sm font-semibold text-slate-900"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register/tenant"
                  className="block px-2 py-2 text-sm font-medium text-teal-700"
                  onClick={() => setOpen(false)}
                >
                  Create tenant account
                </Link>
                <Link
                  href="/auth/register/landlord"
                  className="block px-2 py-2 text-sm font-medium text-slate-600"
                  onClick={() => setOpen(false)}
                >
                  Create landlord account
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
