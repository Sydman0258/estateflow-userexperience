import Header from "@/components/Header";
import Link from "next/link";

export const metadata = { title: "Privacy Policy – EstateFlow" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-8">Last updated: November 2026</p>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">What we collect</h2>
            <p className="text-slate-600 text-sm leading-relaxed">Account details (name, email, phone number), property and rental activity, and payment records needed to operate the service.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">How we use it</h2>
            <p className="text-slate-600 text-sm leading-relaxed">To create and secure your account, send verification codes, show listings, process rental activity and provide support.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Sharing</h2>
            <p className="text-slate-600 text-sm leading-relaxed">Tenants and landlords see the details needed to complete a rental. We do not sell your personal information.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Security</h2>
            <p className="text-slate-600 text-sm leading-relaxed">Sign-in uses email one-time codes. Passwords are stored hashed. Please never share your codes with anyone.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Your choices</h2>
            <p className="text-slate-600 text-sm leading-relaxed">You can update your profile at any time and contact support to request deletion of your account.</p>
          </section>
        </div>
        <div className="mt-8 text-sm">
          <Link href="/" className="text-teal-700 hover:text-teal-800 font-semibold">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
