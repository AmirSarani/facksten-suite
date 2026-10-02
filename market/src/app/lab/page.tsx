import type { ReactNode } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Icon, type IconName } from "@/components/icon";
import { Card } from "@/components/ui/card";
import { PartsCatalog, type CatalogPart } from "@/components/lab/parts-catalog";
import { PlacePartsArt, RunBuyArt, WireUpArt, WriteCodeArt } from "@/components/lab/step-illustrations";
import { LAB_TEMPLATES } from "@/lab/templates";
import { LAB_COMPONENTS_SEED } from "@/lab/registry";

export const metadata: Metadata = {
  title: "آزمایشگاه مجازی قطعات",
  description:
    "مدار بسازید، کد Arduino بنویسید و نتیجه را همان‌جا در مرورگر ببینید. بدون نصب، بدون خرید قطعه.",
};

const fa = (n: number) => n.toLocaleString("fa-IR");

const DIFFICULTY = {
  easy: { label: "ساده", cls: "border-accent-tertiary/50 text-accent-tertiary" },
  medium: { label: "متوسط", cls: "border-primary-container/50 text-primary-container" },
  hard: { label: "پیشرفته", cls: "border-accent-secondary/50 text-accent-secondary" },
} as const;

const btnPrimary =
  "bg-cta focus-cta cyber-chamfer-sm inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 px-6 py-3 font-mono text-sm font-semibold shadow-[var(--box-shadow-neon)] transition-all duration-150";
const btnOutline =
  "focus-cta cyber-chamfer-sm inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 border border-outline px-6 py-3 font-mono text-sm font-semibold text-on-surface transition-all duration-150 hover:border-primary-container hover:text-primary-container hover:shadow-[var(--box-shadow-neon-sm)]";

const STEPS: { art: ReactNode; title: string; text: string }[] = [
  { art: <PlacePartsArt />, title: "قطعه بچینید", text: "برد Arduino، LED، مقاومت و دیگر قطعات را از کاتالوگ روی میز کار بکشید." },
  { art: <WireUpArt />, title: "سیم بکشید", text: "پایه‌ها را وصل کنید؛ خطاهایی مثل اتصال کوتاه همان لحظه هشدار داده می‌شوند." },
  { art: <WriteCodeArt />, title: "کد بنویسید", text: "با C++ آردوینو برنامه بنویسید؛ کامپایل روی سرور انجام می‌شود." },
  { art: <RunBuyArt />, title: "اجرا و خرید", text: "مدار را اجرا کنید و اگر خوب بود، لیست قطعات را یک‌جا به سبد اضافه کنید." },
];

const REAL: { icon: IconName; title: string; text: string }[] = [
  { icon: "memory", title: "میکروکنترلر واقعی", text: "ATmega328P با avr8js در مرورگر اجرا می‌شود؛ خروجی از رجیستر واقعی خوانده می‌شود." },
  { icon: "verified_user", title: "اعتبارسنجی سیم‌کشی", text: "اتصال کوتاه، GND مشترک و LED بدون مقاومت را پیش از اجرا پیدا می‌کند." },
  { icon: "settings_ethernet", title: "Serial Monitor", text: "خروجی Serial.print را با بایت‌های واقعی USART می‌بینید." },
  { icon: "add_shopping_cart", title: "BOM به سبد خرید", text: "قطعات پروژه‌تان را با یک کلیک از فروشگاه PushRSP سفارش دهید." },
];

const catalogParts: CatalogPart[] = LAB_COMPONENTS_SEED.map((c) => ({
  slug: c.slug,
  name: c.name,
  category: c.category,
  status: c.simulationStatus as CatalogPart["status"],
}));

const templates = [...LAB_TEMPLATES].sort(
  (a, b) => ["easy", "medium", "hard"].indexOf(a.difficulty) - ["easy", "medium", "hard"].indexOf(b.difficulty),
);

function SectionHead({ kicker, title, text }: { kicker: string; title: string; text?: string }) {
  return (
    <div className="mb-6 max-w-2xl">
      <p dir="ltr" className="mb-1.5 text-right font-mono text-[11px] uppercase tracking-[0.2em] text-primary-container">{`> ${kicker}`}</p>
      <h2 className="text-2xl font-extrabold text-on-surface md:text-3xl">{title}</h2>
      {text ? <p className="mt-2 text-sm leading-7 text-on-surface-variant">{text}</p> : null}
    </div>
  );
}

function CircuitPreview() {
  return (
    <Card variant="terminal" className="w-full max-w-[520px]">
      <div dir="ltr" className="p-4">
        <svg viewBox="0 0 440 210" role="img" aria-label="پیش‌نمایش مدار: پایه D13 آردوینو از طریق مقاومت به LED وصل است و LED چشمک می‌زند" className="h-auto w-full">
          <rect x="8" y="34" width="118" height="132" fill="var(--surface-container-low)" stroke="var(--outline)" />
          <text x="67" y="26" textAnchor="middle" fill="var(--on-surface-variant)" fontSize="10" fontFamily="var(--font-mono)" letterSpacing="2">ARDUINO UNO</text>
          <rect x="24" y="58" width="44" height="30" fill="none" stroke="var(--accent-tertiary)" strokeOpacity=".5" />
          <text x="46" y="77" textAnchor="middle" fill="var(--accent-tertiary)" fontSize="9" fontFamily="var(--font-mono)">ATmega</text>
          <circle cx="126" cy="70" r="4" fill="var(--primary-container)" />
          <text x="112" y="58" textAnchor="end" fill="var(--on-surface)" fontSize="10" fontFamily="var(--font-mono)">D13</text>
          <circle cx="126" cy="140" r="4" fill="var(--on-surface-variant)" />
          <text x="112" y="158" textAnchor="end" fill="var(--on-surface-variant)" fontSize="10" fontFamily="var(--font-mono)">GND</text>

          <path d="M126 70 H176" stroke="var(--primary-container)" strokeWidth="2" fill="none" className="lab-wire-live" />
          <path d="M176 70 l8 -12 l12 24 l12 -24 l12 24 l12 -24 l8 12 H262" stroke="var(--on-surface)" strokeWidth="2" fill="none" />
          <text x="219" y="102" textAnchor="middle" fill="var(--on-surface-variant)" fontSize="10" fontFamily="var(--font-mono)">220Ω</text>
          <path d="M262 70 H318" stroke="var(--primary-container)" strokeWidth="2" fill="none" className="lab-wire-live" />

          <circle cx="342" cy="70" r="22" fill="var(--primary-container)" className="lab-led-glow" opacity=".25" />
          <circle cx="342" cy="70" r="12" fill="var(--primary-container)" className="lab-led-glow" />
          <circle cx="342" cy="70" r="16" fill="none" stroke="var(--primary-container)" strokeWidth="2" />
          <text x="342" y="112" textAnchor="middle" fill="var(--on-surface-variant)" fontSize="10" fontFamily="var(--font-mono)">LED</text>
          <path d="M342 86 V140 H126" stroke="var(--on-surface-variant)" strokeWidth="2" fill="none" />
        </svg>

        <div className="mt-2 border border-outline bg-background p-3 font-mono text-[11px] leading-5 text-on-surface-variant">
          <p><span className="text-primary-container">&gt;</span> PushRSP Lab Blink</p>
          <p><span className="text-accent-tertiary">PORTB.5</span> = HIGH · 500ms</p>
          <p className="text-on-surface"><span className="text-primary-container">&gt;</span> در حال اجرا…</p>
        </div>
      </div>
    </Card>
  );
}

export default function LabIntroPage() {
  return (
    <main className="mx-auto max-w-6xl px-page py-10 md:py-14">
      {/* 1 — Hero */}
      <section className="mb-16 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
        <div>
          <p dir="ltr" className="mb-3 text-right font-mono text-xs uppercase tracking-[0.25em] text-primary-container">&gt; VIRTUAL_LAB</p>
          <h1 className="text-3xl font-black leading-[1.35] text-on-surface md:text-5xl">
            مدار بسازید،
            <br />
            <span className="text-primary-container">همان‌جا اجرایش کنید.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-on-surface-variant">
            یک آزمایشگاه Arduino داخل مرورگر: قطعات را بچینید، سیم بکشید، کد بنویسید و نتیجه را ببینید.
            بدون نصب برنامه و بدون خرید قطعه.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/lab/workspace?template=blink-led" className={btnPrimary}>
              <Icon name="play_circle" className="h-5 w-5" />
              شروع با یک مثال آماده
            </Link>
            <Link href="/lab/workspace" className={btnOutline}>
              میز کار خالی
            </Link>
          </div>
          <p className="mt-3 text-xs text-on-surface-variant">
            تازه‌کارید؟ «چشمک LED» ساده‌ترین شروع است و کمتر از ۲ دقیقه طول می‌کشد.
          </p>

          <ul className="mt-6 flex flex-wrap gap-2 text-xs text-on-surface-variant">
            {["بدون نیاز به نصب", "کاملاً در مرورگر", "پروژه‌ها در مرورگر شما ذخیره می‌شوند"].map((t) => (
              <li key={t} className="cyber-chamfer-sm inline-flex items-center gap-1.5 border border-outline bg-surface-container-lowest px-3 py-1.5">
                <Icon name="check_circle" className="h-3.5 w-3.5 text-primary-container" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-center lg:justify-end">
          <CircuitPreview />
        </div>
      </section>

      {/* 2 — How it works */}
      <section className="mb-16" aria-labelledby="how-title">
        <SectionHead kicker="HOW_IT_WORKS" title="چهار قدم تا اولین مدار" />
        {/* Mobile: vertical timeline (number node + card). Desktop: 4 illustrated cards. */}
        <ol className="relative grid gap-5 before:absolute before:top-6 before:bottom-6 before:right-[1.375rem] before:w-px before:border-r before:border-dashed before:border-outline sm:grid-cols-2 sm:before:hidden lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative flex items-start gap-3 sm:block">
              <span
                className="cyber-chamfer-sm relative z-10 mt-1 flex size-11 shrink-0 items-center justify-center border border-primary-container bg-background font-mono text-base font-bold text-primary-container shadow-[var(--box-shadow-neon-sm)] sm:hidden"
                aria-hidden
              >
                {fa(i + 1)}
              </span>
              <article className="cyber-chamfer min-w-0 flex-1 overflow-hidden border border-outline bg-surface-container-lowest transition-all duration-150 hover:border-primary-container/60">
                <div className="relative border-b border-outline">
                  {s.art}
                  <span
                    className="cyber-chamfer-sm absolute top-2 right-2 hidden size-7 items-center justify-center bg-cta font-mono text-xs font-bold sm:flex"
                    aria-hidden
                  >
                    {fa(i + 1)}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-on-surface">
                    <span className="sr-only">{`قدم ${fa(i + 1)}: `}</span>
                    {s.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-6 text-on-surface-variant">{s.text}</p>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </section>

      {/* 3 — Templates */}
      <section className="mb-16" id="templates">
        <SectionHead
          kicker="TEMPLATES"
          title="با یک پروژه‌ی آماده شروع کنید"
          text="هر قالب شامل قطعات، سیم‌کشی و کد آماده است؛ فقط باز کنید و اجرا بزنید. بعد هر چیزی را تغییر دهید."
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => {
            const d = DIFFICULTY[t.difficulty];
            const parts = t.bom.reduce((s, l) => s + l.qty, 0);
            return (
              <li key={t.id}>
                <Link
                  href={`/lab/workspace?template=${t.id}`}
                  className="cyber-chamfer group flex h-full flex-col border border-outline bg-surface-container-lowest p-5 transition-all duration-150 hover:border-primary-container hover:shadow-[var(--box-shadow-neon)] focus-cta"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className={`border px-2 py-0.5 font-mono text-[10px] ${d.cls}`}>{d.label}</span>
                    <span className="font-mono text-[11px] text-on-surface-variant">{fa(parts)} قطعه</span>
                  </div>
                  <h3 className="text-base font-bold text-on-surface group-hover:text-primary-container">{t.name}</h3>
                  <p className="mt-1.5 flex-1 text-xs leading-6 text-on-surface-variant">{t.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-primary-container">
                    باز کردن و اجرا
                    <Icon name="arrow_forward" className="h-4 w-4" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-xs text-on-surface-variant">
          پروژه‌های ذخیره‌شده‌ی خودتان را در{" "}
          <Link href="/lab/projects" className="text-primary-container underline">
            پروژه‌های من
          </Link>{" "}
          پیدا می‌کنید.
        </p>
      </section>

      {/* 4 — What's real + honest limits */}
      <section className="mb-16">
        <SectionHead kicker="UNDER_THE_HOOD" title="چه چیزی واقعی است؟" text="خروجی‌ها ساختگی نیستند؛ همان چیزی را می‌بینید که میکروکنترلر تولید می‌کند." />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
          <ul className="grid gap-4 sm:grid-cols-2">
            {REAL.map((f) => (
              <li key={f.title} className="cyber-chamfer flex gap-3 border border-outline bg-surface-container-lowest p-4">
                <span className="cyber-chamfer-sm flex size-10 shrink-0 items-center justify-center bg-primary-container/10 text-primary-container">
                  <Icon name={f.icon} className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">{f.title}</h3>
                  <p className="mt-1 text-xs leading-6 text-on-surface-variant">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <aside className="cyber-chamfer border border-accent-secondary/40 bg-surface-container-low p-5">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-on-surface">
              <span className="size-2 rounded-full bg-accent-secondary" aria-hidden />
              محدودیت‌های فعلی
            </h3>
            <ul className="space-y-1.5 text-xs leading-6 text-on-surface-variant">
              <li>شبیه‌ساز SPICE کامل وجود ندارد.</li>
              <li>اسیلوسکوپ و Logic Analyzer فقط ساده‌اند.</li>
              <li>بعضی قطعات فقط «سیم‌کشی» یا «مدل سه‌بعدی» هستند و رفتار زنده ندارند.</li>
              <li>کتابخانه‌های Wire و LiquidCrystal هنوز پشتیبانی نمی‌شوند.</li>
            </ul>
          </aside>
        </div>
      </section>

      {/* 5 — Parts catalog */}
      <section className="mb-16" id="parts">
        <SectionHead
          kicker="PARTS_CATALOG"
          title={`کاتالوگ قطعات (${fa(catalogParts.length)})`}
          text="روی هر قطعه بزنید تا روی میز کار قرار بگیرد. نشان کنار هر قطعه می‌گوید چه کاری با آن ممکن است."
        />
        <PartsCatalog parts={catalogParts} />
      </section>

      {/* 6 — Final CTA */}
      <section className="cyber-chamfer mb-12 border border-primary-container/40 bg-surface-container-low p-8 text-center shadow-[var(--box-shadow-neon-sm)]">
        <h2 className="text-xl font-extrabold text-on-surface md:text-2xl">آماده‌اید اولین مدارتان را بسازید؟</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-on-surface-variant">
          با «چشمک LED» شروع کنید؛ قطعات و کد آماده‌اند و فقط باید اجرا را بزنید.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/lab/workspace?template=blink-led" className={btnPrimary}>
            <Icon name="play_circle" className="h-5 w-5" />
            شروع کنید
          </Link>
          <Link href="/shop" className={btnOutline}>
            دیدن قطعات فروشگاه
          </Link>
        </div>
      </section>

      {/* 7 — License */}
      <details className="border-t border-outline pt-4 text-xs leading-7 text-on-surface-variant">
        <summary className="cursor-pointer font-semibold text-on-surface">مجوز و انتساب مدل‌های سه‌بعدی</summary>
        <p className="mt-2">
          مدل‌های سه‌بعدی قطعات از سه منبع باز گرفته و به GLB ساده‌سازی شده‌اند:
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <a href="https://github.com/adafruit/Adafruit_CAD_Parts" className="text-primary-container underline" target="_blank" rel="noopener noreferrer">
              Adafruit_CAD_Parts
            </a>{" "}
            (مجوز MIT) — پتانسیومتر
          </li>
          <li>
            <a href="https://github.com/FreeCAD/FreeCAD-library" className="text-primary-container underline" target="_blank" rel="noopener noreferrer">
              FreeCAD-library
            </a>{" "}
            (مجوز CC-BY 3.0) — Arduino Uno، Arduino Nano، سروو SG90، HC-SR04
          </li>
          <li>
            <a href="https://gitlab.com/kicad/libraries/kicad-packages3D" className="text-primary-container underline" target="_blank" rel="noopener noreferrer">
              kicad-packages3D
            </a>{" "}
            (مجوز CC-BY-SA 4.0) — LED، LED RGB، دکمه، بازر، LCD 1602، OLED
          </li>
        </ul>
        <p className="mt-2">
          بقیه‌ی قطعات (بردبورد، مقاومت‌ها، DHT22، PIR) مدل ساده‌شده‌ی داخلی دارند، نه CAD واقعی.
          متن کامل مجوزها در <code className="font-mono">src/lab/licenses/</code>، فهرست انتساب هر قطعه در{" "}
          <code className="font-mono">public/lab/models/CREDITS.md</code> و مستندات فنی در{" "}
          <code className="font-mono">docs/lab/README.md</code>.
        </p>
      </details>
    </main>
  );
}
