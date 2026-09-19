import Link from "next/link";
import { Icon } from "@/components/icon";
import { UI_IMAGES } from "@/lib/media";
import { SITE } from "@/lib/site";

export const metadata = { title: "درباره ما" };

const values = [
  { title: "نوآوری", body: "پیشگام بودن در ارائه جدیدترین تکنولوژی‌ها و راهکارهای مهندسی به بازار.", icon: "new_releases" as const },
  { title: "کیفیت", body: "سخت‌افزارهای اورجینال با ضمانت سلامت فیزیکی و رهگیری تأمین‌کننده.", icon: "verified_user" as const },
  { title: "آموزش", body: "مستندات فارسی، مقالات و مسیر یادگیری برای مهندسان و سازندگان.", icon: "description" as const },
  { title: "جامعه", body: "شبکه نمایندگان، پشتیبانی فنی و اکوسیستم پروژه‌های متن‌باز.", icon: "schema" as const },
];

const team = [
  { name: "امیرحسین رضایی", role: "مدیرعامل (CEO)", image: UI_IMAGES.team[0] },
  { name: "مریم شریفی", role: "مدیر فنی (CTO)", image: UI_IMAGES.team[1] },
  { name: "کیانوش احمدی", role: "مهندس ارشد", image: UI_IMAGES.team[2] },
  { name: "سارا نوری", role: "مدیر پشتیبانی", image: UI_IMAGES.team[3] },
];

export default function AboutPage() {
  return (
    <main className="cyber-grid mx-auto max-w-[1280px] px-margin-mobile py-12 md:px-margin-desktop md:pt-16">
      <section className="mb-16 flex flex-col items-center gap-10 text-center md:flex-row md:text-right">
        <div className="flex-1 space-y-6">
          <h1 className="font-mono text-3xl font-extrabold uppercase tracking-wide text-on-surface md:text-[40px] md:leading-[56px]">
            توانمندسازی مهندسان،
            <br />
            <span className="text-primary-container">خلق آینده‌ای هوشمندتر</span>
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-on-surface-variant">
            ماموریت {SITE.name} فراهم آوردن بستری یکپارچه برای دسترسی به برترین قطعات سخت‌افزاری و
            ابزارهای نرم‌افزاری است. ما به سازندگان و مهندسان کمک می‌کنیم ایده‌های خود را سریع‌تر به
            واقعیت تبدیل کنند.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2 md:justify-start">
            <Link
              href="/shop"
              className="bg-cta focus-cta cyber-chamfer-sm px-8 py-3 font-mono text-sm font-semibold uppercase tracking-wide shadow-[var(--box-shadow-neon-sm)]"
            >
              مشاهده محصولات
            </Link>
            <Link
              href="/contact"
              className="cyber-chamfer-sm border border-outline bg-surface-container-lowest px-8 py-3 font-mono text-sm font-semibold uppercase tracking-wide transition-colors hover:border-primary-container hover:text-primary-container"
            >
              تماس با تیم ما
            </Link>
          </div>
        </div>
        <div className="relative h-[400px] w-full flex-1 overflow-hidden cyber-chamfer border border-outline shadow-[var(--box-shadow-neon-sm)]">
          <picture>
            <source srcSet="/images/ui/about-hero.webp" type="image/webp" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={UI_IMAGES.aboutHero}
              alt="آزمایشگاه مهندسی Facksten"
              width={2400}
              height={1309}
              decoding="async"
              fetchPriority="high"
              className="h-full w-full object-cover object-center"
            />
          </picture>
        </div>
      </section>

      <section className="mb-16 cyber-chamfer border border-outline bg-surface-container-low p-8 shadow-[var(--box-shadow-neon-sm)] md:p-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="order-2 h-[350px] overflow-hidden cyber-chamfer-sm border border-outline md:order-1">
            <picture>
              <source srcSet="/images/ui/about-story.webp" type="image/webp" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={UI_IMAGES.aboutStory}
                alt="داستان شکل‌گیری Facksten"
                width={2000}
                height={1090}
                decoding="async"
                className="h-full w-full object-cover object-center"
              />
            </picture>
          </div>
          <div className="order-1 space-y-4 md:order-2">
            <h2 className="font-mono text-3xl font-bold uppercase tracking-wide text-on-surface">داستان شکل‌گیری ما</h2>
            <div className="mb-2 h-1 w-16 bg-primary-container shadow-[var(--box-shadow-neon-sm)]" />
            <p className="leading-8 text-on-surface-variant">
              {SITE.name} از نیاز به یک هاب جامع برای سخت‌افزار و محصولات دانلودی مهندسی متولد شد.
              بنیان‌گذاران ما که خود سال‌ها در الکترونیک و برنامه‌نویسی فعال بوده‌اند، پلتفرمی ساختند
              که مرز فیزیک و دیجیتال را کم‌رنگ می‌کند.
            </p>
            <p className="leading-8 text-on-surface-variant">
              امروز ما فقط فروشگاه نیستیم؛ اکوسیستمی برای قطعات اورجینال، سورس‌کد و مستندات فارسی
              هستیم.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-16">
        <div className="mb-10 text-center">
          <h2 className="mb-2 font-mono text-3xl font-bold uppercase tracking-wide">ارزش‌های بنیادین</h2>
          <p className="text-on-surface-variant">اصولی که هر روز ما را جلو می‌برند</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <div
              key={v.title}
              className="cyber-chamfer border border-outline bg-surface-container-lowest p-8 shadow-[var(--box-shadow-neon-sm)] transition hover:-translate-y-0.5 hover:border-primary-container hover:shadow-[var(--box-shadow-neon)]"
            >
              <div className="mb-6 flex h-14 w-14 items-center justify-center cyber-chamfer-sm border border-primary-container/30 bg-primary-container/10 text-primary-container">
                <Icon name={v.icon} className="h-7 w-7" />
              </div>
              <h3 className="mb-3 font-mono text-xl font-semibold uppercase tracking-wide">{v.title}</h3>
              <p className="text-sm leading-7 text-on-surface-variant">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <div className="mb-10 flex items-end justify-between border-b border-outline pb-4">
          <div>
            <h2 className="font-mono text-3xl font-bold uppercase tracking-wide">تیم رهبری ما</h2>
            <p className="mt-1 text-on-surface-variant">افرادی که محصول و پشتیبانی را جلو می‌برند</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
          {team.map((t) => (
            <div key={t.name} className="group">
              <div className="relative mb-4 aspect-[4/5] overflow-hidden cyber-chamfer border border-outline bg-surface-container-high">
                <picture>
                  <source srcSet={t.image.replace(/\.jpg$/, ".webp")} type="image/webp" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.image}
                    alt={t.name}
                    width={966}
                    height={1200}
                    decoding="async"
                    className="h-full w-full object-cover object-top grayscale transition-all duration-500 group-hover:grayscale-0"
                  />
                </picture>
              </div>
              <h3 className="font-mono text-xl font-bold text-on-surface">{t.name}</h3>
              <p className="mt-1 text-sm text-primary-container">{t.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative flex h-[500px] items-center overflow-hidden cyber-chamfer border border-outline shadow-[var(--box-shadow-neon-sm)] md:h-[540px]">
        <picture>
          <source srcSet="/images/ui/about-lab.webp" type="image/webp" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={UI_IMAGES.aboutLab}
            alt="آزمایشگاه تخصصی Facksten"
            width={2800}
            height={1562}
            decoding="async"
            className="absolute inset-0 h-full w-full scale-[1.28] object-cover object-[72%_58%]"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-l from-background/90 via-background/70 to-transparent" />
        <div className="relative z-10 max-w-2xl p-12 md:p-20">
          <div className="mb-6 inline-flex items-center gap-2 cyber-chamfer-sm border border-outline bg-surface-container-lowest/80 px-4 py-2 backdrop-blur-md">
            <Icon name="schema" className="h-4 w-4 text-primary-container" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wide text-on-surface">آزمایشگاه تخصصی</span>
          </div>
          <h2 className="mb-4 font-mono text-3xl font-bold uppercase tracking-wide text-on-surface md:text-4xl">جایی که دقت، استاندارد می‌شود</h2>
          <p className="mb-6 leading-8 text-on-surface-variant">
            قطعات سخت‌افزاری قبل از عرضه در لَب {SITE.name} از نظر سلامت فیزیکی و سازگاری بررسی می‌شوند تا
            تجربه مهندسی شما پایدار بماند.
          </p>
          <Link
            href="/articles"
            className="bg-cta focus-cta inline-flex cyber-chamfer-sm px-8 py-3 font-mono text-sm font-semibold uppercase tracking-wide shadow-[var(--box-shadow-neon-sm)] transition active:scale-95"
          >
            آشنایی با استانداردها
          </Link>
        </div>
      </section>
    </main>
  );
}
