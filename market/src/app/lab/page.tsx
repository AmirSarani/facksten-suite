import Link from "next/link";
import type { Metadata } from "next";
import { LAB_TEMPLATES } from "@/lab/templates";
import { LAB_COMPONENTS_SEED } from "@/lab/registry";
import { SIM_STATUS_LABEL } from "@/lab/registry";

export const metadata: Metadata = {
  title: "آزمایشگاه مجازی قطعات",
  description:
    "شبیه‌سازی Arduino با avr8js، سیم‌کشی بردبورد، و اتصال به فروشگاه فکستن — بدون ادعای SPICE کامل.",
};

export default function LabIntroPage() {
  return (
    <main className="mx-auto max-w-5xl px-page py-10">
      <div className="mb-8">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-primary">Virtual Lab</p>
        <h1 className="text-3xl font-black text-on-surface md:text-4xl">آزمایشگاه مجازی قطعات</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-on-surface-variant">
          مدار بسازید، سیم‌کشی را اعتبارسنجی کنید، کد Arduino را واقعاً با{" "}
          <strong className="text-on-surface">avr-gcc</strong> کامپایل و با{" "}
          <strong className="text-on-surface">avr8js</strong> در مرورگر اجرا کنید. خروجی LED ساختگی
          نیست — از رجیستر PORTB میکروکنترلر خوانده می‌شود.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/lab/workspace"
            className="bg-cta focus-cta cyber-chamfer-sm inline-flex items-center px-6 py-3 font-mono text-sm font-semibold shadow-[var(--box-shadow-neon)]"
          >
            شروع ساخت پروژه
          </Link>
          <Link
            href="/lab/workspace?template=blink-led"
            className="cyber-chamfer-sm inline-flex items-center border border-outline px-5 py-3 font-mono text-sm hover:border-primary hover:text-primary"
          >
            باز کردن قالب Blink
          </Link>
          <Link
            href="/lab/projects"
            className="cyber-chamfer-sm inline-flex items-center border border-outline px-5 py-3 text-sm text-on-surface-variant hover:text-on-surface"
          >
            پروژه‌ها و قالب‌ها
          </Link>
        </div>
      </div>

      <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          "شبیه‌سازی واقعی ATmega328P با avr8js در Web Worker",
          "اعتبارسنجی سیم‌کشی (GND مشترک، اتصال کوتاه، LED بدون مقاومت، …)",
          "ویرایشگر Monaco برای کد Arduino C++",
          "Serial Monitor با بایت‌های واقعی USART",
          "BOM پروژه → افزودن به سبد فروشگاه",
          "قطعات بدون مدل رفتاری صریحاً «۳D-only / wireable» هستند",
        ].map((t) => (
          <div
            key={t}
            className="cyber-chamfer border border-outline bg-surface-container-low p-4 text-sm leading-6 text-on-surface-variant"
          >
            {t}
          </div>
        ))}
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-bold">قالب‌های آماده</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {LAB_TEMPLATES.map((t) => (
            <Link
              key={t.id}
              href={`/lab/workspace?template=${t.id}`}
              className="rounded border border-outline bg-surface-container p-4 transition hover:border-primary/60"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-on-surface">{t.name}</h3>
                <span className="text-[10px] text-on-surface-variant">{t.difficulty}</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-on-surface-variant">{t.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-bold">کاتالوگ قطعات ({LAB_COMPONENTS_SEED.length})</h2>
        <div className="overflow-x-auto rounded border border-outline">
          <table className="w-full min-w-[480px] text-right text-sm">
            <thead className="bg-surface-container text-xs text-on-surface-variant">
              <tr>
                <th className="p-2">نام</th>
                <th className="p-2">وضعیت شبیه‌سازی</th>
                <th className="p-2">دسته</th>
              </tr>
            </thead>
            <tbody>
              {LAB_COMPONENTS_SEED.map((c) => (
                <tr key={c.id} className="border-t border-outline">
                  <td className="p-2">
                    <Link
                      href={`/lab/workspace?part=${c.slug}`}
                      className="text-primary hover:underline"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="p-2 text-on-surface-variant">
                    {SIM_STATUS_LABEL[c.simulationStatus]}
                  </td>
                  <td className="p-2 text-on-surface-variant">{c.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded border border-outline bg-surface-container-low p-5 text-sm leading-7 text-on-surface-variant">
        <h2 className="mb-2 font-bold text-on-surface">مجوز و انتساب</h2>
        <p>
          مدل‌های CAD و منابع قطعات از{" "}
          <a
            href="https://github.com/adafruit/Adafruit_CAD_Parts"
            className="text-primary underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Adafruit_CAD_Parts
          </a>{" "}
          تحت مجوز MIT استفاده می‌شوند. جزئیات در{" "}
          <code className="text-xs">src/lab/licenses/</code> و{" "}
          <code className="text-xs">docs/lab/README.md</code>.
        </p>
        <p className="mt-2">
          <strong className="text-on-surface">محدودیت‌های صادقانه:</strong> SPICE کامل، اسیلوسکوپ واقعی،
          Logic Analyzer عمیق، و تبدیل خودکار همه STEP→Draco LOD در این MVP نیستند.
        </p>
      </section>
    </main>
  );
}
