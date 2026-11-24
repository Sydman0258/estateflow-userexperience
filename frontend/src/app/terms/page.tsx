import Header from "@/components/Header";
import Link from "next/link";

export const metadata = { title: "Terms of Service – EstateFlow" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Terms of Service</h1>
        <p className="text-slate-500 text-sm mb-8">Last updated: November 2026</p>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">1. Using EstateFlow</h2>
            <p className="text-slate-600 text-sm leading-relaxed">EstateFlow connects tenants with landlords. By creating an account you agree to provide accurate information and to keep your login credentials, including one-time codes, private.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">2. Accounts</h2>
            <p className="text-slate-600 text-sm leading-relaxed">Accounts are verified by email one-time code. You are responsible for activity under your account. We may suspend accounts that violate these terms or applicable law.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">3. Listings and rentals</h2>
            <p className="text-slate-600 text-sm leading-relaxed">Landlords are responsible for the accuracy of their listings and for their rental agreements. EstateFlow is a platform and is not a party to any lease between tenant and landlord.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">4. Payments</h2>
            <p className="text-slate-600 text-sm leading-relaxed">Rent and deposit payments are recorded on the platform. Disputes should be raised with the landlord first, then with our support team.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">5. Changes</h2>
            <p className="text-slate-600 text-sm leading-relaxed">We may update these terms from time to time. Continued use of the service after changes means you accept the updated terms.</p>
          </section>
        </div>
        <div className="mt-8 text-sm">
          <Link href="/" className="text-teal-700 hover:text-teal-800 font-semibold">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
