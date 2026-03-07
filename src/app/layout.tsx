import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";

import { Footer } from "@/components/footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Forex Practice - Smart Money Concepts Trading",
    template: "%s | Forex Practice",
  },
  description:
    "Practice forex trading with Smart Money Concepts. Learn to predict price direction using EUR/USD and XAU/USD with Fair Value Gap analysis.",
  keywords: [
    "forex trading",
    "trading practice",
    "smart money concepts",
    "fair value gap",
    "price action trading",
    "EUR/USD",
    "XAU/USD",
    "gold trading",
  ],
  authors: [{ name: "Forex Practice" }],
  creator: "Forex Practice",
  publisher: "Forex Practice",
  metadataBase: new URL("https://forex-practice.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://forex-practice.com",
    siteName: "Forex Practice",
    title: "Forex Practice - Smart Money Concepts Trading",
    description:
      "Practice forex trading with Smart Money Concepts. Learn to predict price direction using EUR/USD and XAU/USD with Fair Value Gap analysis.",
    images: [
      {
        url: "/pwa-512x512.png",
        width: 1200,
        height: 630,
        alt: "Forex Practice - Smart Money Concepts Trading",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Forex Practice - Smart Money Concepts Trading",
    description:
      "Practice forex trading with Smart Money Concepts. Learn to predict price direction using EUR/USD and XAU/USD with Fair Value Gap analysis.",
    images: ["/pwa-512x512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon-180x180.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} flex min-h-screen flex-col`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <main className="flex-1">{children}</main>
            <Footer />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
