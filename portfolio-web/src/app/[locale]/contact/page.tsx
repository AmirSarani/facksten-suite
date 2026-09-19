import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactForm } from "@/components/contact-form";
import { SectionHeading } from "@/components/section-heading";
import { toMailtoHref, toTelHref, toWhatsAppHref } from "@/lib/contact-href";
import { t } from "@/lib/i18n";
import { isLocale } from "@/lib/locale";
import { getSettingsMap, pickCopy } from "@/lib/settings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: t(locale).pages.contactTitle };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw;
  const dict = t(locale);
  const settings = await getSettingsMap();
  const contact = settings.contact;
  const email = contact?.email ?? "studio@facksten.com";
  const phone = contact?.phone ?? "۰۲۱-۱۲۳۴۵۶۷۸";
  const mailto = toMailtoHref(email);
  const tel = toTelHref(phone);
  const whatsapp = toWhatsAppHref(contact?.whatsapp);
  const address = pickCopy(contact?.address, locale, "");
  const hours = pickCopy(contact?.hours, locale, "");

  return (
    <div className="px-page mx-auto flex max-w-6xl min-w-0 flex-col gap-8 py-6 md:grid md:grid-cols-2 md:gap-10 md:py-section">
      <div>
        <SectionHeading kicker="CONTACT" title={dict.pages.contactTitle} latin={locale === "en"} />
        <div className="mt-5 grid gap-2">
          {tel ? (
            <a
              href={tel}
              className="focus-cta bg-cta cyber-chamfer-sm inline-flex min-h-11 w-full flex-wrap items-center justify-center gap-1 px-4 text-sm font-semibold"
            >
              {dict.contact.call}
              <span className="ms-2 break-all font-mono text-xs font-normal">{phone}</span>
            </a>
          ) : null}
          {mailto ? (
            <a
              href={mailto}
              className="focus-cta cyber-chamfer-sm inline-flex min-h-11 w-full flex-wrap items-center justify-center gap-1 border border-outline px-4 text-sm hover:border-primary-container hover:text-cta"
            >
              {dict.contact.email}
              <span className="ms-2 break-all font-mono text-xs text-cta">{email}</span>
            </a>
          ) : null}
          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-cta cyber-chamfer-sm inline-flex min-h-11 w-full flex-wrap items-center justify-center gap-1 border border-outline px-4 text-sm hover:border-primary-container hover:text-cta"
            >
              {dict.contact.whatsapp}
            </a>
          ) : null}
        </div>
      </div>
      <ContactForm locale={locale} className="md:col-start-2 md:row-span-2" />
      <div className="md:col-start-1">
        <p className="text-fluid-lead text-on-surface-variant">{dict.pages.contactLead}</p>
        <dl className="mt-6 grid gap-3 text-sm">
          {address ? (
            <div>
              <dt className="font-mono text-[11px] tracking-[0.18em] text-on-surface-variant uppercase">
                {dict.contact.address}
              </dt>
              <dd className="mt-1">{address}</dd>
            </div>
          ) : null}
          {hours ? (
            <div>
              <dt className="font-mono text-[11px] tracking-[0.18em] text-on-surface-variant uppercase">
                {dict.contact.hours}
              </dt>
              <dd className="mt-1">{hours}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </div>
  );
}
