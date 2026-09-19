import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { localeDir, parseLocale } from "@/lib/locale";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Facksten | Studio",
    template: "%s | Facksten",
  },
  description: "Facksten electronics systems studio — hardware, firmware, industrial UI.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3020"),
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = parseLocale((await headers()).get("x-locale"));
  return (
    <html lang={locale} dir={localeDir(locale)} className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Oxanium:wght@500;600;700&family=Vazirmatn:wght@400;600;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-full flex-col bg-background font-sans text-on-surface">{children}</body>
    </html>
  );
}
