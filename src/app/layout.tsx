// =============================================================================
// Root Layout
// =============================================================================
// The top-level layout for the entire application.
// Sets up fonts, global CSS, metadata, and providers.
// =============================================================================

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

// WHY Inter instead of Geist? Inter is widely regarded as one of the best
// sans-serif fonts for UI — highly legible at all sizes, clean, and modern.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LegitBites — Cashflow Management",
  description:
    "Aplikasi pencatatan arus kas untuk usaha kuliner. Mudah digunakan, aman, dan real-time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans antialiased`}>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
