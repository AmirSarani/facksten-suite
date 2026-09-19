import Link from "next/link";
import { Icon, type IconName } from "@/components/icon";

const ITEMS: { title: string; body: string; icon: IconName; href: string }[] = [
  { title: "اصالت کالا", body: "قطعات اورجینال با تضمین سلامت", icon: "verified_user", href: "/warranty" },
  { title: "ارسال سریع", body: "آماده ارسال از انبار تهران", icon: "local_shipping", href: "/shipping" },
  { title: "مرجوعی آسان", body: "۷ روز مهلت مرجوعی", icon: "inventory_2", href: "/returns" },
  { title: "پشتیبانی فنی", body: "راهنمایی برای انتخاب قطعه", icon: "support_agent", href: "/faq" },
];

export function TrustUspBar() {
  return (
    <section className="home-section-enter home-section-enter-delay-1 overflow-x-hidden border-b border-outline-variant/40 bg-surface-container-low">
      <div className="mx-auto max-w-[1280px] min-w-0 px-page py-3 sm:py-3.5">
        <p className="mb-2 hidden font-mono text-[10px] uppercase tracking-[0.2em] text-accent-tertiary sm:block">
          &gt; TRUST::MODULES
        </p>
        <ul className="grid grid-cols-2 md:grid-cols-4">
          {ITEMS.map((item, i) => {
            const borders = [
              i % 2 === 1 ? "border-s border-outline-variant/40" : "",
              i >= 2 ? "border-t border-outline-variant/40 md:border-t-0" : "",
              i > 0 ? "md:border-s md:border-outline-variant/50" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <li key={item.title} className={`min-w-0 ${borders}`}>
                <Link
                  href={item.href}
                  className="focus-cta group flex min-w-0 cursor-pointer items-center gap-2 px-1 py-2.5 transition-colors duration-200 hover:text-primary-container sm:gap-3 sm:px-3 md:justify-center md:px-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center font-mono text-xs text-primary-container transition-transform duration-200 group-hover:scale-105">
                    &gt;
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-on-surface group-hover:text-primary-container">
                      <span className="sr-only">دستور: </span>
                      {item.title}
                    </p>
                    <p className="mt-0.5 line-clamp-1 font-mono text-[11px] text-on-surface-variant">{item.body}</p>
                  </div>
                  <Icon
                    name={item.icon}
                    className="hidden h-4 w-4 shrink-0 text-on-surface-variant opacity-40 group-hover:text-primary-container group-hover:opacity-100 sm:block"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
