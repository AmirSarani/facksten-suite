import { Icon } from "@/components/icon";

const QUOTES = [
  {
    name: "رضا م.",
    role: "مهندس سخت‌افزار",
    text: "قطعات اورجینال رسید و برای پروژه صنعتی‌مان دقیقاً همان مشخصات کاتالوگ بود.",
  },
  {
    name: "نیلوفر ک.",
    role: "دانشجوی رباتیک",
    text: "سورس‌کدها تمیز و مستند بودند؛ برای شروع پروژه خیلی وقت خریدم.",
  },
  {
    name: "امیر ح.",
    role: "فریلنسر IoT",
    text: "پشتیبانی فنی قبل از خرید کمک کرد سنسور درست را انتخاب کنم.",
  },
];

export function SocialProof() {
  const [featured, ...rest] = QUOTES;

  return (
    <section className="home-section-enter home-band-circuit">
      <div className="mx-auto max-w-[1280px] px-page py-home">
        <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent-secondary" dir="ltr">
              // SOCIAL::PROOF
            </p>
            <h2 className="mt-1 text-fluid-title font-bold text-on-surface text-balance">
              مهندسان و سازندگان به Facksten اعتماد می‌کنند
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">بازخورد کوتاه از کاربران واقعی فروشگاه</p>
          </div>
          <div className="cyber-chamfer-sm inline-flex items-center gap-2 border border-outline-variant bg-surface-container-lowest/80 px-3 py-1.5 text-sm text-on-surface shadow-[var(--box-shadow-neon-sm)]">
            <span className="flex gap-0.5 text-primary-container" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon key={i} name="star" className="h-4 w-4" />
              ))}
            </span>
            <span className="font-mono font-semibold">۴٫۸</span>
            <span className="text-on-surface-variant">از ۵</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-10">
          <blockquote className="relative overflow-hidden border border-outline-variant bg-surface-container-lowest/60 cyber-chamfer p-6 shadow-[var(--box-shadow-neon-secondary)]">
            <span
              className="mb-2 block font-mono text-5xl leading-none text-primary-container/40"
              aria-hidden
            >
              &quot;
            </span>
            <p className="text-lg leading-8 font-medium text-on-surface text-pretty sm:text-xl sm:leading-9">
              «{featured.text}»
            </p>
            <footer className="mt-5 flex items-center gap-3">
              <span className="cyber-chamfer-sm flex h-10 w-10 items-center justify-center border border-primary-container/30 bg-primary-container/15 text-sm font-bold text-primary-container">
                {featured.name.charAt(0)}
              </span>
              <div>
                <p className="text-sm font-semibold text-on-surface">{featured.name}</p>
                <p className="font-mono text-xs text-accent-tertiary">{featured.role}</p>
              </div>
            </footer>
          </blockquote>

          <ul className="flex flex-col justify-center gap-5 border-t border-outline-variant/50 pt-5 lg:border-t-0 lg:border-r lg:border-outline-variant/50 lg:pr-8 lg:pt-0">
            {rest.map((q) => (
              <li key={q.name} className="transition-colors duration-300">
                <blockquote className="border-s-2 border-accent-tertiary/40 ps-4">
                  <p className="text-sm leading-7 text-on-surface-variant">«{q.text}»</p>
                  <footer className="mt-2">
                    <span className="text-sm font-semibold text-on-surface">{q.name}</span>
                    <span className="mx-1.5 text-on-surface-variant">·</span>
                    <span className="font-mono text-xs text-on-surface-variant">{q.role}</span>
                  </footer>
                </blockquote>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
