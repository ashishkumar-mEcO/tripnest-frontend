import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TripNest | Explore Destinations & Plan Your Journeys",
  description: "Your ultimate travel companion to organize itineraries, track budgets, and explore worldwide destinations seamlessly.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/logo.png?v=5" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/logo.png?v=5" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png?v=5" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
