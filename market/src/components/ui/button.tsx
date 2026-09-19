import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "default" | "secondary" | "outline" | "ghost" | "glitch";

const variants: Record<Variant, string> = {
  default:
    "border-2 border-primary-container bg-transparent text-primary-container hover:bg-primary-container hover:text-on-primary hover:shadow-[var(--box-shadow-neon)]",
  secondary:
    "border-2 border-accent-secondary bg-transparent text-accent-secondary hover:bg-accent-secondary hover:text-background hover:shadow-[var(--box-shadow-neon-secondary)]",
  outline:
    "border border-outline bg-transparent text-on-surface hover:border-primary-container hover:text-primary-container hover:shadow-[var(--box-shadow-neon-sm)]",
  ghost:
    "border-0 bg-transparent text-on-surface-variant hover:bg-primary-container/10 hover:text-primary-container",
  glitch:
    "border-0 bg-primary-container text-on-primary shadow-[var(--box-shadow-neon)] hover:brightness-110 cyber-glitch",
};

export function Button({
  variant = "default",
  className = "",
  children,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <button
      type={type}
      className={[
        "cyber-chamfer-sm inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 px-5 py-2.5",
        "font-mono text-sm font-semibold uppercase tracking-[0.15em]",
        "transition-all duration-150 focus-cta disabled:pointer-events-none disabled:opacity-40",
        variants[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
