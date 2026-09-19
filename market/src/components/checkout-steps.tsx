import Link from "next/link";

const steps = [
  { n: 1, label: "ارسال", href: "/checkout/shipping" },
  { n: 2, label: "پرداخت", href: "/checkout/payment" },
  { n: 3, label: "بازبینی", href: "/checkout/success" },
];

export function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="cyber-chamfer relative mb-8 flex items-center justify-between overflow-hidden border border-outline bg-surface-container-lowest p-6 shadow-[var(--box-shadow-neon-sm)]">
      <div className="absolute top-1/2 right-0 left-0 -z-10 h-0.5 -translate-y-1/2 bg-surface-variant" />
      <div
        className="absolute top-1/2 right-0 -z-10 h-0.5 -translate-y-1/2 bg-primary-container"
        style={{ width: `${((current - 1) / (steps.length - 1)) * 100}%` }}
      />
      {steps.map((s) => {
        const active = s.n <= current;
        return (
          <div key={s.n} className="flex flex-col items-center gap-2 bg-surface-container-lowest px-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                active ? "bg-primary-container text-on-primary shadow-[var(--box-shadow-neon-sm)]" : "bg-surface-variant text-on-surface-variant"
              }`}
            >
              {s.n}
            </div>
            {s.n < 3 ? (
              <Link
                href={s.href}
                className={`text-sm font-semibold ${active ? "text-primary-container" : "text-on-surface-variant"}`}
              >
                {s.label}
              </Link>
            ) : (
              <span className={`text-sm font-semibold ${active ? "text-primary-container" : "text-on-surface-variant"}`}>
                {s.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
