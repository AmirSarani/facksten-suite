import Link from "next/link";
import { Icon } from "@/components/icon";
import { NewTicketForm } from "@/components/new-ticket-form";
import { requireUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/catalog";
import { UI_IMAGES } from "@/lib/media";
import { SITE } from "@/lib/site";

export const metadata = { title: "تماس با ما" };

export default async function ContactPage() {
  const [user, settings] = await Promise.all([
    requireUser(["CUSTOMER", "ADMIN"]),
    getSiteSettings(),
  ]);
  const contactInfo = {
    address: settings.address || SITE.address,
    phone: settings.phone || SITE.phone,
    email: settings.email || SITE.email,
  };

  return (
    <main className="cyber-grid mx-auto w-full max-w-[1280px] flex-grow px-margin-mobile pt-12 pb-20 md:px-margin-desktop md:pt-16">
      <section className="mb-12 text-center md:text-right">
        <h1 className="mb-3 font-mono text-3xl font-extrabold uppercase tracking-wide text-on-surface md:text-[40px] md:leading-[56px]">
          ارتباط با تیم مهندسی {SITE.name}
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-8 text-on-surface-variant md:mx-0">
          ما اینجا هستیم تا به سوالات فنی شما پاسخ دهیم و تجربه خریدی بی‌نظیر از تجهیزات الکترونیکی را
          برای شما فراهم کنیم. پیام خود را بگذارید، در سریع‌ترین زمان پاسخگو خواهیم بود.
        </p>
      </section>

      <div className="mb-16 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="h-full cyber-chamfer border border-outline bg-surface-container-lowest p-6 shadow-[var(--box-shadow-neon-sm)]">
            <h2 className="mb-6 font-mono text-xl font-semibold uppercase tracking-wide text-on-surface">اطلاعات تماس</h2>
            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center cyber-chamfer-sm border border-outline bg-surface-container-low text-primary-container">
                  <Icon name="location_on" className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-on-surface">آدرس دفتر مرکزی</h3>
                  <p className="text-sm leading-6 text-on-surface-variant">{contactInfo.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center cyber-chamfer-sm border border-outline bg-surface-container-low text-primary-container">
                  <Icon name="call" className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-on-surface">تلفن پشتیبانی</h3>
                  <p className="text-sm text-on-surface-variant" dir="ltr">
                    {contactInfo.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center cyber-chamfer-sm border border-outline bg-surface-container-low text-primary-container">
                  <Icon name="mail" className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-on-surface">ایمیل سازمانی</h3>
                  <p className="text-sm text-on-surface-variant">{contactInfo.email}</p>
                </div>
              </div>
            </div>
            <hr className="my-6 border-outline" />
            <h3 className="mb-4 text-sm font-semibold text-on-surface">شبکه‌های اجتماعی تخصصی</h3>
            <div className="flex gap-4">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center cyber-chamfer-sm border border-outline bg-surface-container-low text-on-surface-variant transition-colors hover:border-primary-container hover:text-primary-container"
                aria-label="اشتراک‌گذاری"
              >
                <Icon name="share" className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center cyber-chamfer-sm border border-outline bg-surface-container-low text-on-surface-variant transition-colors hover:border-primary-container hover:text-primary-container"
                aria-label="لینک"
              >
                <Icon name="link" className="h-5 w-5" />
              </a>
            </div>

            <hr className="my-6 border-outline" />
            <div className="cyber-chamfer-sm border border-outline bg-surface-container-low/60 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center cyber-chamfer-sm border border-primary-container/30 bg-primary-container/15 text-primary-container">
                  <Icon name="support_agent" className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-on-surface">ثبت تیکت</h3>
              </div>
              {user ? (
                <>
                  <p className="mb-3 text-xs leading-5 text-on-surface-variant">
                    موضوع و شرح درخواست خود را بنویسید؛ پاسخ در بخش تیکت‌های حساب کاربری شما ثبت می‌شود.
                  </p>
                  <NewTicketForm compact />
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm leading-6 text-on-surface-variant">
                    برای ثبت تیکت پشتیبانی باید وارد حساب کاربری خود شوید.
                  </p>
                  <Link
                    href="/login?next=/contact"
                    className="bg-cta focus-cta inline-flex w-full items-center justify-center gap-2 cyber-chamfer-sm px-4 py-2.5 font-mono text-sm font-semibold uppercase tracking-wide shadow-[var(--box-shadow-neon-sm)] transition-all active:scale-[0.98]"
                  >
                    ورود برای ثبت تیکت
                    <Icon name="person" className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="cyber-chamfer border border-outline bg-surface-container-lowest p-6 shadow-[var(--box-shadow-neon-sm)] md:p-12">
            <h2 className="mb-6 font-mono text-xl font-semibold uppercase tracking-wide text-on-surface">ارسال پیام</h2>
            <form className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wide text-on-surface-variant">نام و نام خانوادگی</span>
                  <input
                    type="text"
                    placeholder="مهندس علی رضایی"
                    className="cyber-chamfer-sm w-full border border-outline bg-surface-container-lowest px-4 py-3 font-mono text-sm text-primary-container outline-none transition-colors focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)]"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wide text-on-surface-variant">آدرس ایمیل</span>
                  <input
                    type="email"
                    dir="ltr"
                    placeholder="ali.rezaei@example.com"
                    className="cyber-chamfer-sm w-full border border-outline bg-surface-container-lowest px-4 py-3 text-left font-mono text-sm text-primary-container outline-none transition-colors focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)]"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2">
                <span className="font-mono text-xs font-semibold uppercase tracking-wide text-on-surface-variant">موضوع پیام</span>
                <input
                  type="text"
                  placeholder="مشاوره خرید قطعات"
                  className="cyber-chamfer-sm w-full border border-outline bg-surface-container-lowest px-4 py-3 font-mono text-sm text-primary-container outline-none transition-colors focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)]"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="font-mono text-xs font-semibold uppercase tracking-wide text-on-surface-variant">متن پیام</span>
                <textarea
                  rows={5}
                  placeholder="درخواست مشاوره برای راه‌اندازی خط تولید..."
                  className="cyber-chamfer-sm w-full resize-none border border-outline bg-surface-container-lowest px-4 py-3 font-mono text-sm text-primary-container outline-none transition-colors focus:border-primary-container focus:shadow-[var(--box-shadow-neon-sm)]"
                />
              </label>
              <button
                type="submit"
                className="bg-cta focus-cta mt-4 flex w-full items-center justify-center gap-2 self-end cyber-chamfer-sm px-8 py-3 font-mono text-sm font-semibold uppercase tracking-wide shadow-[var(--box-shadow-neon-sm)] transition-all active:scale-95 md:w-auto"
              >
                <span>ارسال پیام به دپارتمان فنی</span>
                <Icon name="send" className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      <section className="relative h-[420px] w-full overflow-hidden cyber-chamfer border border-outline shadow-[var(--box-shadow-neon-sm)] md:h-[480px]">
        <div className="absolute inset-0 bg-surface-container-low">
          <picture>
            <source srcSet="/images/ui/contact-map.webp" type="image/webp" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={UI_IMAGES.contactMap}
              alt="نقشه دفتر مرکزی پارک فناوری"
              width={2816}
              height={1536}
              decoding="async"
              fetchPriority="high"
              className="h-full w-full object-cover object-center"
            />
          </picture>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-container-lowest/50 via-transparent to-transparent" />
        <div className="absolute bottom-6 left-6 flex items-center gap-3 cyber-chamfer-sm border border-outline bg-surface-container-lowest/95 px-4 py-3 shadow-[var(--box-shadow-neon-sm)] backdrop-blur-sm">
          <div className="h-3 w-3 animate-pulse bg-primary-container shadow-[var(--box-shadow-neon-sm)]" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wide text-on-surface">مسیریابی به دفتر مرکزی</span>
        </div>
      </section>
    </main>
  );
}
