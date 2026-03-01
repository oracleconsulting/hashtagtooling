import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

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
  title: "#TOOLING | Handcrafted Woodworking Tools",
  description:
    "Custom woodworking mallets, awls, and tools handcrafted from the world's finest exotic timbers. Over 75 wood species available. Made to order in the UK.",
  keywords:
    "woodworking mallets, custom mallets, handmade tools, exotic wood, woodworking awls, EDC coins, hashtag tooling",
  openGraph: {
    title: "#TOOLING | Handcrafted Woodworking Tools",
    description:
      "Custom woodworking mallets and awls handcrafted from exotic timbers.",
    siteName: "#TOOLING",
    type: "website",
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
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
