import type { Metadata } from "next";
import { CartProvider } from "@/components/cart-provider";
import { CompareProvider } from "@/components/compare-provider";
import { RouteWarmer } from "@/components/route-warmer";
import { SiteChrome } from "@/components/site-chrome";
import { getNavCategoryTree, getSiteSettings } from "@/lib/catalog";
import { SITE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} | ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description:
    "فروشگاه تخصصی قطعات الکترونیک فکستن — مقاومت، خازن، آردوینو، ESP، سنسور و ابزار با ارسال سریع.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3100"),
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Always load categories so client navigations from /login → shop still have header data
  const [categories, settings] = await Promise.all([
    getNavCategoryTree().catch(() => []),
    getSiteSettings().catch(() => null),
  ]);
  const headerCategories = categories.map((c) => ({
    slug: c.slug,
    name: c.name,
    icon: c.icon,
    children: c.children.map((ch) => ({ slug: ch.slug, name: ch.name, icon: ch.icon })),
  }));
  const contact = {
    phone: settings?.phone || SITE.phone,
    email: settings?.email || SITE.email,
    address: settings?.address || SITE.address,
  };

  return (
    <html lang="fa" dir="rtl" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Oxanium:wght@500;600;700&family=Vazirmatn:wght@400;600;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-full flex-col bg-background font-sans text-on-surface">
        <CartProvider>
          <CompareProvider>
            <SiteChrome categories={headerCategories} contact={contact}>
              {children}
            </SiteChrome>
            <RouteWarmer />
          </CompareProvider>
        </CartProvider>
      </body>
    </html>
  );
}
