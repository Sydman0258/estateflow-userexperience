import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Instrument_Sans,
  Tiro_Devanagari_Hindi,
} from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

// Used for the Nepali word "घर" (ghar, "home") on the landing page.
const tiro = Tiro_Devanagari_Hindi({
  subsets: ["devanagari", "latin"],
  weight: "400",
  variable: "--font-tiro",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EstateFlow – Monthly rentals in Nepal, direct from landlords",
  description:
    "Rent a home in Kathmandu, Lalitpur or Pokhara directly from verified landlords. Prices in NPR, no broker fees, pay with eSewa or card once you're accepted.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${instrument.variable} ${tiro.variable}`}
    >
      <body className="antialiased bg-[#fafafa] text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
