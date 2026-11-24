import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EstateFlow – Monthly rentals from verified landlords",
  description:
    "Discover furnished homes with transparent pricing, zero broker markups, and simple monthly commitments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#fafafa] text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
