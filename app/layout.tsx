import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Nicord",
    template: "%s | Nicord",
  },
  description:
    "Sistem kerja untuk UMKM social commerce — rekap order, stok, pembayaran, dan laporan cashflow.",
  manifest: "/manifest.json",
  applicationName: "Nicord",
  keywords: ["umkm", "order", "stok", "cashflow", "whatsapp", "social commerce"],
  authors: [{ name: "Vierth Labs" }],
  robots: "noindex,nofollow", // Private app — no SEO indexing
};

export const viewport: Viewport = {
  themeColor: "#0064E0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
