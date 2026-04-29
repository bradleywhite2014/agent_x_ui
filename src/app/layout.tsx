import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { loadGlobalThemeState } from "@/lib/theme/prefs.server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agent X",
  description:
    "A personal agentic work-surface that runs on your machine and shapes its UI around how you work.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialGlobalTheme = loadGlobalThemeState();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <Providers initialGlobalTheme={initialGlobalTheme}>{children}</Providers>
      </body>
    </html>
  );
}
