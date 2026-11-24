"use client";

import Header from "@/components/Header";
import { PaymentRecord } from "@/lib/api";
import Link from "next/link";
import { useState } from "react";

const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 901,
    property_id: 1,
    property_name: "The Atlantic Studio Loft",
    amount: 2450,
    currency: "USD",
    payment_type: "RENT",
    status: "PENDING",
    period_start: "2024-12-01",
    period_end: "2024-12-31",
    created_at: "2024-11-20",
    external_reference: "INV-2024-12-901",
  },
  {
    id: 900,
    property_id: 1,
    property_name: "The Atlantic Studio Loft",
    amount: 2450,
    currency: "USD",
    payment_type: "RENT",
    status: "COMPLETED",
    period_start: "2024-11-01",
    period_end: "2024-11-30",
    created_at: "2024-11-01",
    external_reference: "PAY-GATE-882194",
  },
  {
    id: 899,
    property_id: 1,
    property_name: "The Atlantic Studio Loft",
    amount: 2450,
    currency: "USD",
    payment_type: "RENT",
    status: "COMPLETED",
    period_start: "2024-10-01",
    period_end: "2024-10-31",
    created_at: "2024-10-01",
    external_reference: "PAY-GATE-774012",
  },
  {
    id: 898,
    property_id: 1,
    property_name: "The Atlantic Studio Loft",
    amount: 2450,
    currency: "USD",
    payment_type: "DEPOSIT",
    status: "COMPLETED",
    period_start: "2024-08-01",
    period_end: "2025-07-31",
    created_at: "2024-07-28",
    external_reference: "DEP-GATE-100234",
  },
];

export default function TenantPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>(INITIAL_PAYMENTS);
  const [filter, setFilter] = useState<"ALL" | "COMPLETED" | "PENDING">("ALL");
  const [payingId, setPayingId] = useState<number | null>(null);
  const [successNotice, setSuccessNotice] = useState("");

  const filtered = payments.filter((p) => (filter === "ALL" ? true : p.status === filter));

  function handlePay(id: number) {
    setPayingId(id);
    setTimeout(() => {
      setPayments((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "COMPLETED",
                external_reference: `PAY-TXN-${Date.now().toString().slice(-6)}`,
              }
            : item
        )
      );
      setPayingId(null);
      setSuccessNotice("Payment processed successfully! Your receipt is ready.");
      setTimeout(() => setSuccessNotice(""), 4000);
    }, 1000);
  }

  function handleDownloadReceipt(ref: string) {
    alert(`Downloading PDF receipt for transaction reference: ${ref}`);
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      <div className="max-w-[1120px] mx-auto px-5 sm:px-8 py-10">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <Link href="/tenant/dashboard" className="hover:text-slate-900">
            Tenant Portal
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-medium">Payment History</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Rent Payments & Invoices
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Securely track rental payments, security deposits, and download tax receipts.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-xs text-slate-500">Auto-Pay:</span>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200/60">
              Enabled (Bank Transfer)
            </span>
          </div>
        </div>

        {successNotice && (
          <div className="my-6 p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 text-sm flex items-center justify-between">
            <span>{successNotice}</span>
            <button onClick={() => setSuccessNotice("")} className="font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Upcoming Due Rent
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-2">$2,450.00</p>
            <p className="text-xs text-amber-600 font-medium mt-1">Due on December 1, 2024</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Rent Paid
            </p>
            <p className="text-3xl font-bold text-teal-700 mt-2">$7,350.00</p>
            <p className="text-xs text-slate-500 mt-1">3 completed monthly periods</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Security Deposit Held
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-2">$2,450.00</p>
            <p className="text-xs text-slate-500 mt-1">Held in verified escrow</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit my-6">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Invoices ({payments.length})
          </button>
          <button
            onClick={() => setFilter("PENDING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "PENDING" ? "bg-white text-amber-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Pending ({payments.filter((p) => p.status === "PENDING").length})
          </button>
          <button
            onClick={() => setFilter("COMPLETED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "COMPLETED" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Completed ({payments.filter((p) => p.status === "COMPLETED").length})
          </button>
        </div>

        {/* Invoices list */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map((payment) => (
              <div
                key={payment.id}
                className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:bg-slate-50/50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">
                      {payment.payment_type === "RENT" ? "Monthly Rent Payment" : "Security Deposit"}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        payment.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          : "bg-amber-50 text-amber-700 border border-amber-200/60"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {payment.property_name} • Ref: {payment.external_reference || "N/A"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Rental Period: {payment.period_start} to {payment.period_end}
                  </p>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-5">
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-900">
                      ${payment.amount.toLocaleString()} {payment.currency}
                    </p>
                    <p className="text-xs text-slate-400">Date: {payment.created_at}</p>
                  </div>

                  <div>
                    {payment.status === "PENDING" ? (
                      <button
                        type="button"
                        onClick={() => handlePay(payment.id)}
                        disabled={payingId === payment.id}
                        className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        {payingId === payment.id ? "Processing..." : "Pay Now"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDownloadReceipt(payment.external_reference || "")}
                        className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition-colors"
                      >
                        Receipt PDF
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
