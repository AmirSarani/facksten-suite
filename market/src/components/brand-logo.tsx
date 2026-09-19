import Link from "next/link";
import { SITE } from "@/lib/site";

type Props = {
  href?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  tone?: "dark" | "light";
};

const sizes = {
  sm: { wrap: "gap-2", mark: "h-7 w-7 text-[13px]", word: "text-[15px] tracking-[0.18em]" },
  md: { wrap: "gap-2 sm:gap-2.5", mark: "h-8 w-8 text-[14px] sm:h-9 sm:w-9 sm:text-[15px]", word: "text-[15px] tracking-[0.16em] sm:text-[18px] sm:tracking-[0.2em] md:text-[20px]" },
  lg: { wrap: "gap-2.5 sm:gap-3", mark: "h-10 w-10 text-[16px] sm:h-11 sm:w-11 sm:text-[17px]", word: "text-[20px] tracking-[0.18em] sm:text-[22px] sm:tracking-[0.22em] md:text-[26px]" },
};

/** Industrial wordmark — sharp monogram + tracked Latin name */
export function BrandLogo({ href = "/", size = "md", className = "", tone = "dark" }: Props) {
  const s = sizes[size];
  const fack = tone === "light" ? "text-on-surface" : "text-on-surface";
  const sten = "text-primary-container";

  const inner = (
    <span className={`brand-logo inline-flex max-w-full items-center ${s.wrap} ${className}`}>
      <span
        aria-hidden
        className={`brand-logo__mark relative inline-flex shrink-0 items-center justify-center ${s.mark}`}
      >
        <span className="brand-logo__mark-face absolute inset-0" />
        <span className="brand-logo__glyph relative font-bold leading-none text-on-surface">F</span>
      </span>
      <span className={`brand-logo__word truncate font-semibold uppercase leading-none ${s.word}`}>
        <span className={fack}>Fack</span>
        <span className={sten}>sten</span>
      </span>
      <span className="sr-only">{SITE.name}</span>
    </span>
  );

  if (href == null) return inner;

  return (
    <Link href={href} prefetch className="inline-flex shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
      {inner}
    </Link>
  );
}
