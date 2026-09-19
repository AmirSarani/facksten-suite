import Link from "next/link";
import { Icon, resolveIconName, type IconName } from "@/components/icon";

export type StripCategory = {
  href: string;
  label: string;
  icon: IconName;
  /** @deprecated images removed from strip — icons only */
  image?: string | null;
};

export function CategoryStrip({ categories }: { categories: StripCategory[] }) {
  const items =
    categories.length > 0
      ? categories
      : [
          { href: "/shop", label: "فروشگاه", icon: "memory" as const },
          { href: "/shop?type=digital", label: "دیجیتال", icon: "folder_zip" as const },
          { href: "/articles", label: "مقالات", icon: "description" as const },
        ];

  return (
    <section className="home-section-enter overflow-x-hidden border-b border-outline-variant/60 bg-surface-container-lowest">
      <div className="mx-auto max-w-[1280px] min-w-0 px-page py-3 sm:py-4">
        <div className="max-w-full min-w-0 overflow-x-auto pb-0.5 no-scrollbar">
          <div className="flex snap-x snap-mandatory gap-1 sm:gap-2">
          {items.map((c) => {
            const icon = resolveIconName(c.icon, "memory");
            return (
              <Link
                key={c.href}
                href={c.href}
                prefetch
                className="focus-cta group flex w-[7.75rem] shrink-0 snap-start cursor-pointer flex-col items-center gap-2 px-2 py-2 text-center transition-all duration-200 sm:w-auto sm:min-w-[6.5rem] sm:flex-1"
              >
                <span className="cyber-chamfer-sm flex h-12 w-12 items-center justify-center border border-outline-variant bg-surface-container-low text-primary-container transition-all duration-200 group-hover:border-primary-container group-hover:bg-primary-container group-hover:text-on-primary group-hover:shadow-[var(--box-shadow-neon)]">
                  <Icon name={icon} className="h-6 w-6" />
                </span>
                <span className="line-clamp-2 text-xs font-semibold text-on-surface group-hover:text-primary-container sm:text-sm">
                  {c.label}
                </span>
              </Link>
            );
          })}
          </div>
        </div>
      </div>
    </section>
  );
}
