import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Icon, type IconName } from "@/components/icon";
import { EXTERNAL, NAV, SITE } from "@/lib/site";

const TRUST: { icon: IconName; label: string; href: string }[] = [
  { icon: "verified_user", label: "اصالت کالا", href: "/warranty" },
  { icon: "local_shipping", label: "ارسال سریع", href: "/shipping" },
  { icon: "support_agent", label: "پشتیبانی فنی", href: "/faq" },
  { icon: "lock", label: "پرداخت امن", href: "/faq" },
];

const SHOP_LINKS = [
  ...NAV.filter((n) => n.href !== "/contact"),
  { href: "/shop?type=digital", label: "محصولات دیجیتال" },
].filter(
  (item, i, arr) => arr.findIndex((x) => x.href === item.href) === i,
);

const HELP_LINKS = [
  { href: "/faq", label: "سوالات متداول" },
  { href: "/shipping", label: "ارسال سفارش" },
  { href: "/returns", label: "مرجوعی" },
  { href: "/warranty", label: "گارانتی" },
  { href: "/contact", label: "تماس با ما" },
];

const ECOSYSTEM = [
  { href: EXTERNAL.industrial, label: "خدمات صنعتی" },
  { href: EXTERNAL.academy, label: "آکادمی" },
  { href: EXTERNAL.lab, label: "لابراتوار" },
];

function FooterHeading({ children }: { children: ReactNode }) {
  return (
    <h4 className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary-container">
      <span className="inline-block border-b border-primary-container pb-1">{children}</span>
    </h4>
  );
}

export function SiteFooter({
  contact,
}: {
  contact?: { phone?: string; email?: string; address?: string };
}) {
  const phone = contact?.phone || SITE.phone;
  const email = contact?.email || SITE.email;
  const address = contact?.address || SITE.address;
  const year = new Intl.DateTimeFormat("fa-IR", { year: "numeric" }).format(new Date());
  const phoneHref = `tel:${phone.replace(/[^\d+]/g, "") || phone}`;

  return (
    <footer className="cyber-grid relative mt-16 w-full overflow-hidden border-t border-outline bg-surface-container-low px-page pt-10 pb-8 sm:mt-20 sm:pt-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 85% 0%, rgba(255,122,0,0.18), transparent 55%), radial-gradient(ellipse at 15% 20%, rgba(0,212,255,0.08), transparent 45%)",
        }}
      />

      <div className="relative mx-auto mb-10 grid max-w-[1280px] grid-cols-2 gap-3 border-b border-outline pb-8 sm:grid-cols-4 sm:gap-4">
        {TRUST.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            prefetch
            className="focus-cta group flex items-center gap-2.5 px-1 py-1.5 transition-colors duration-150 hover:bg-surface-container/60 sm:justify-center sm:px-2"
          >
            <span className="cyber-chamfer-sm flex h-9 w-9 shrink-0 items-center justify-center border border-outline text-primary-container transition-all group-hover:border-primary-container group-hover:bg-primary-container group-hover:text-on-primary group-hover:shadow-[var(--box-shadow-neon-sm)]">
              <Icon name={item.icon} className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold text-on-surface">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <BrandLogo size="lg" />
          <p className="mt-4 max-w-md text-sm leading-7 text-on-surface-variant sm:text-base">
            فروشگاه تخصصی قطعات الکترونیک، بردهای توسعه و تجهیزات رباتیک — با تضمین اصالت و ارسال سریع به سراسر کشور.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={`mailto:${email}`}
              className="cyber-chamfer-sm focus-cta inline-flex h-10 cursor-pointer items-center gap-2 border border-outline bg-surface-container-lowest/70 px-4 text-sm font-semibold text-on-surface transition-all duration-150 hover:border-primary-container hover:text-primary-container hover:shadow-[var(--box-shadow-neon-sm)]"
            >
              <Icon name="mail" className="h-4 w-4 text-primary-container" />
              ایمیل
            </a>
            <Link
              href="/contact"
              prefetch
              className="cyber-chamfer-sm focus-cta inline-flex h-10 cursor-pointer items-center gap-2 border border-outline bg-surface-container-lowest/70 px-4 text-sm font-semibold text-on-surface transition-all duration-150 hover:border-primary-container hover:text-primary-container hover:shadow-[var(--box-shadow-neon-sm)]"
            >
              <Icon name="call" className="h-4 w-4 text-primary-container" />
              تماس با ما
            </Link>
            <Link
              href="/shop"
              prefetch
              className="cyber-chamfer-sm bg-cta focus-cta inline-flex h-10 cursor-pointer items-center gap-2 px-4 font-mono text-xs font-semibold uppercase tracking-wider shadow-[var(--box-shadow-neon-sm)] transition-colors duration-150"
            >
              فروشگاه
              <Icon name="arrow_forward" className="h-4 w-4 rotate-180" />
            </Link>
          </div>
          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold text-on-surface-variant">اکوسیستم فکستن</p>
            <div className="flex flex-wrap gap-2">
              {ECOSYSTEM.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="cyber-chamfer-sm inline-flex items-center gap-1 border border-outline bg-surface-container px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant transition-colors hover:border-primary-container hover:text-primary-container"
                >
                  <Icon name="link" className="h-3.5 w-3.5 text-primary-container" />
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <FooterHeading>خرید</FooterHeading>
          <ul className="flex flex-col gap-2.5">
            {SHOP_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  prefetch
                  className="focus-cta text-sm text-on-surface-variant transition-colors duration-200 hover:text-primary-container"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <FooterHeading>راهنما</FooterHeading>
          <ul className="flex flex-col gap-2.5">
            {HELP_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  prefetch
                  className="focus-cta text-sm text-on-surface-variant transition-colors duration-200 hover:text-primary-container"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={EXTERNAL.industrial}
                className="focus-cta text-sm text-on-surface-variant transition-colors duration-200 hover:text-primary-container"
              >
                خدمات صنعتی
              </a>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-3">
          <FooterHeading>ارتباط با ما</FooterHeading>
          <ul className="space-y-3 text-sm text-on-surface-variant">
            <li className="flex items-start gap-2.5">
              <Icon name="location_on" className="mt-0.5 h-4 w-4 shrink-0 text-primary-container" />
              <span>{address}</span>
            </li>
            <li>
              <a href={phoneHref} className="focus-cta flex items-center gap-2.5 transition-colors hover:text-primary-container" dir="ltr">
                <Icon name="call" className="h-4 w-4 shrink-0 text-primary-container" />
                {phone}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${email}`}
                className="focus-cta flex items-center gap-2.5 transition-colors hover:text-primary-container"
                dir="ltr"
              >
                <Icon name="mail" className="h-4 w-4 shrink-0 text-primary-container" />
                {email}
              </a>
            </li>
          </ul>
          <p className="cyber-chamfer-sm mt-4 inline-flex items-center gap-2 border border-outline bg-surface-container-lowest/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
            <Icon name="support_agent" className="h-3.5 w-3.5 text-primary-container" />
            شنبه تا چهارشنبه ۹ تا ۱۸
          </p>
        </div>
      </div>

      <div className="relative mx-auto mt-10 flex max-w-[1280px] flex-col items-center justify-between gap-4 border-t border-outline-variant/40 pt-6 md:flex-row">
        <div className="text-center md:text-right">
          <p className="text-sm text-on-surface-variant">
            © {year} تمامی حقوق برای {SITE.name} محفوظ است
          </p>
          <p className="mt-1 text-xs text-on-surface-variant/80">{SITE.tagline}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { label: "اینماد", title: "نماد اعتماد الکترونیکی — پس از دریافت مجوز" },
            { label: "ساماندهی", title: "سامانه ساماندهی — پس از دریافت مجوز" },
            { label: "زرین‌پال", title: "درگاه پرداخت امن — پس از اتصال" },
          ].map((b) => (
            <span
              key={b.label}
              className="cyber-chamfer-sm inline-flex min-h-10 min-w-[4.5rem] items-center justify-center border border-outline bg-surface-container-lowest/80 px-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant"
              title={b.title}
            >
              {b.label}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
