import type { InputHTMLAttributes } from "react";

export function Input({
  className = "",
  showPrefix = true,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { showPrefix?: boolean }) {
  return (
    <div className="relative w-full">
      {showPrefix ? (
        <span
          className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 font-mono text-sm text-primary-container"
          aria-hidden
        >
          &gt;
        </span>
      ) : null}
      <input
        className={[
          "cyber-chamfer-sm w-full min-h-11 border border-outline bg-surface-container-lowest",
          "font-mono text-sm tracking-wide text-primary-container",
          "placeholder:text-on-surface-variant placeholder:normal-case",
          "transition-all duration-200 focus:border-primary-container focus:shadow-[var(--box-shadow-neon)] focus:outline-none",
          showPrefix ? "ps-8 pe-3 py-2.5" : "px-3 py-2.5",
          className,
        ].join(" ")}
        {...props}
      />
    </div>
  );
}
