/** External projects — linked later; placeholders for now */
export const EXTERNAL = {
  industrial: process.env.NEXT_PUBLIC_INDUSTRIAL_URL ?? "#industrial",
  academy: process.env.NEXT_PUBLIC_ACADEMY_URL ?? "#academy",
  lab: process.env.NEXT_PUBLIC_LAB_URL ?? "/lab",
} as const;

export const SITE = {
  name: "Facksten",
  tagline: "فروشگاه تخصصی الکترونیک",
  phone: "۰۲۱-۱۲۳۴۵۶۷۸",
  email: "info@facksten.com",
  address: "تهران، خیابان جمهوری",
} as const;

export type NavItem = {
  href: string;
  label: string;
  external?: boolean;
};

/** Primary header/footer nav — short and task-focused */
export const NAV: NavItem[] = [
  { href: "/shop", label: "فروشگاه" },
  { href: "/shop?type=digital", label: "محصولات دیجیتال" },
  { href: "/lab", label: "آزمایشگاه مجازی" },
  { href: "/articles", label: "مقالات" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
];

/** Public portfolio origin. Empty/whitespace hides the header item. */
export function getPortfolioUrl(
  raw: string | undefined = process.env.NEXT_PUBLIC_PORTFOLIO_URL,
): string | null {
  const url = raw?.trim();
  return url ? url : null;
}

/**
 * Header nav only. Portfolio stays out of `NAV` so the footer shop list
 * is unchanged. Placed after مقالات: storefront destinations first, then
 * institutional links (درباره ما / تماس با ما).
 * Lab is in NAV so hamburger + desktop both show it.
 */
export function getHeaderNav(
  portfolioUrl: string | null = getPortfolioUrl(),
): NavItem[] {
  if (!portfolioUrl) return NAV;
  const item: NavItem = { href: portfolioUrl, label: "نمونه کارها", external: true };
  const articlesIndex = NAV.findIndex((navItem) => navItem.href === "/articles");
  if (articlesIndex < 0) return [...NAV, item];
  return [...NAV.slice(0, articlesIndex + 1), item, ...NAV.slice(articlesIndex + 1)];
}
