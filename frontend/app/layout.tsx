import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Route 66 AI Assistant — europetrip.us",
  description: "Ask anything about Route 66 — powered by our official guides.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-screen`}>
      <body className="h-screen flex overflow-hidden">{children}</body>
    </html>
  );
}
