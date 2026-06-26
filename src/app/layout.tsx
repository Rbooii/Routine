import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Routine — Smart Skincare Routine Manager",
  description:
    "Never miss a step in your skincare routine. Routine helps you manage complex post-clinic skincare regimens with smart scheduling, product mixing rules, and timely reminders.",
  keywords: [
    "skincare",
    "routine",
    "beauty",
    "dermatology",
    "skincare management",
    "reminder",
  ],
  authors: [{ name: "Routine" }],
  openGraph: {
    title: "Routine — Smart Skincare Routine Manager",
    description:
      "Manage your post-clinic skincare routine with ease. Smart scheduling, ingredient conflict detection, and timely reminders.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-center"
            richColors
            closeButton
            theme="system"
          />
        </Providers>
      </body>
    </html>
  );
}
