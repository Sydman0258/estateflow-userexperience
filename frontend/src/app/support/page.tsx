"use client";

import Header from "@/components/Header";
import Link from "next/link";
import { useState } from "react";

const FAQS = [
  ["I did not receive my verification code", "Check your spam folder, then use \"Resend code\" on the verification page. Codes can be re-sent after about a minute."],
  ["My code says invalid or expired", "Codes are short-lived. Request a new one and enter the most recent code only."],
  ["I forgot my password", "Use \"Forgot password?\" on the sign-in page. We will email you a code to set a new password."],
  ["How do I list a property?", "Create a landlord account, activate it with your email code, then add your property from the landlord dashboard."],
];

export default function SupportPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ email: "", subject: "", message: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // No support endpoint exists on the backend yet: open the user's mail client instead.
    const body = encodeURIComponent(`${form.message}\n\nFrom: ${form.email}`);
    window.location.href = `mailto:support@estateflow.local?subject=${encodeURIComponent(form.subject)}&body=${body}`;
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Support</h1>
        <p className="text-slate-500 text-sm mb-8">Answers to common questions, or send us a message.</p>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100 mb-8">
          {FAQS.map(([q, a]) => (
            <div key={q} className="p-6">
              <h2 className="font-semibold text-slate-900 mb-1">{q}</h2>
              <p className="text-sm text-slate-600">{a}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Contact us</h2>
          {sent && (
            <div className="text-sm text-teal-800 bg-teal-50 p-3 rounded-xl border border-teal-100">
              Your email app should have opened with your message ready to send.
            </div>
          )}
          <input type="email" required placeholder="Your email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
          <input required placeholder="Subject" value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
          <textarea required rows={5} placeholder="How can we help?" value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
          <button type="submit" className="bg-teal-700 hover:bg-teal-800 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
            Send message
          </button>
        </form>

        <div className="mt-8 text-sm">
          <Link href="/" className="text-teal-700 hover:text-teal-800 font-semibold">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
