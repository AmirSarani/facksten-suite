import type { HTMLAttributes, ReactNode } from "react";

type Variant = "default" | "terminal" | "holographic";

const variants: Record<Variant, string> = {
  default:
    "border border-outline bg-surface-container-lowest transition-all duration-300 hover:border-primary-container hover:shadow-[var(--box-shadow-neon)]",
  terminal: "border border-outline bg-background pt-8",
  holographic:
    "border border-primary-container/30 bg-surface-container/30 shadow-[var(--box-shadow-neon)] backdrop-blur-md",
};

export function Card({
  variant = "default",
  hoverEffect = false,
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  variant?: Variant;
  hoverEffect?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={[
        "cyber-chamfer relative",
        variants[variant],
        hoverEffect ? "hover:-translate-y-0.5" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {variant === "terminal" ? (
        <div
          className="absolute inset-x-0 top-0 flex h-7 items-center gap-1.5 border-b border-outline bg-surface-container-low px-3"
          aria-hidden
        >
          <span className="size-2.5 rounded-full bg-error/80" />
          <span className="size-2.5 rounded-full bg-primary-container/80" />
          <span className="size-2.5 rounded-full bg-accent-tertiary/80" />
          <span className="ms-auto font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
            term://session
          </span>
        </div>
      ) : null}
      {variant === "holographic" ? (
        <>
          <span className="pointer-events-none absolute start-0 top-0 h-3 w-3 border-s-2 border-t-2 border-primary-container" />
          <span className="pointer-events-none absolute end-0 top-0 h-3 w-3 border-e-2 border-t-2 border-primary-container" />
          <span className="pointer-events-none absolute bottom-0 start-0 h-3 w-3 border-b-2 border-s-2 border-primary-container" />
          <span className="pointer-events-none absolute bottom-0 end-0 h-3 w-3 border-b-2 border-e-2 border-primary-container" />
        </>
      ) : null}
      {children}
    </div>
  );
}
