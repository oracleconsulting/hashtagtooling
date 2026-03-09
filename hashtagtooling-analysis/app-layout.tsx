import type { Metadata } from "next";
import { Suspense } from "react";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CookieConsent } from "@/components/CookieConsent";
import { AnalyticsLoader } from "@/components/AnalyticsLoader";
import { FloatingBuildCTA } from "@/components/FloatingBuildCTA";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "700", "900"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hashtag.guru"),
  title: {
    default: "#TOOLING | Handcrafted Woodworking Tools from Exotic Timbers",
    template: "%s | #TOOLING",
  },
  description:
    "Custom woodworking mallets, awls, and tools handcrafted from the world's finest exotic timbers. Over 75 wood species available. Made to order in the UK.",
  keywords:
    "woodworking mallets, custom mallets, handmade tools, exotic wood, woodworking awls, EDC coins, bespoke woodworking tools, UK craftsman",
  openGraph: {
    title: "#TOOLING | Handcrafted Woodworking Tools",
    description:
      "Custom woodworking mallets and awls handcrafted from exotic timbers. Every piece unique.",
    siteName: "#TOOLING",
    type: "website",
    locale: "en_GB",
    url: "https://hashtag.guru",
    images: [{ url: "https://hashtag.guru/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "#TOOLING | Handcrafted Woodworking Tools",
    description:
      "Custom woodworking mallets and awls handcrafted from exotic timbers.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://hashtag.guru",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-body bg-brand-dark text-white">
        <Suspense fallback={<header className="border-b border-brand-dark-border bg-brand-dark sticky top-0 z-50 h-16" />}>
          <Header />
        </Suspense>
        <main className="min-h-screen">{children}</main>
        <Footer />
        <Suspense fallback={null}>
          <FloatingBuildCTA />
        </Suspense>
        <CookieConsent />
        <AnalyticsLoader />
      </body>
    </html>
  );
}
