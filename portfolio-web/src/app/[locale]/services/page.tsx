import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionHeading } from "@/components/section-heading";
import { ServiceCard } from "@/components/service-card";
import { localizeService, publishedServices } from "@/lib/content";
import { t } from "@/lib/i18n";
import { isLocale } from "@/lib/locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: t(locale).pages.servicesTitle };
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw;
  const dict = t(locale);
  const services = await publishedServices();

  return (
    <div className="px-page mx-auto max-w-6xl py-section">
      <SectionHeading
        kicker="SERVICES"
        title={dict.pages.servicesTitle}
        lead={dict.pages.servicesLead}
        latin={locale === "en"}
      />
      {services.length === 0 ? (
        <p className="mt-10 text-on-surface-variant">{dict.empty.services}</p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((row, index) => {
            const item = localizeService(row, locale);
            return (
              <article key={row.slug} className="grid gap-3">
                <ServiceCard
                  index={index}
                  title={String(item.title)}
                  summary={String(item.summary)}
                  latin={locale === "en"}
                />
                {item.body ? (
                  <p className="break-words px-1 text-sm leading-7 text-on-surface-variant whitespace-pre-line">
                    {String(item.body)}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
