import type { Metadata } from "next";
import { FaqClient } from "@/components/faq-client";
import { getSiteSettings } from "@/lib/catalog";
import { mergeFaqs } from "@/lib/faq";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "سوالات متداول و مرکز راهنما",
  description: `پاسخ سوالات رایج درباره سفارش، ارسال، مرجوعی، پرداخت و پشتیبانی فنی ${SITE.name}`,
};

export default async function FaqPage() {
  const settings = await getSiteSettings();
  const fromDb = JSON.parse(settings.faqJson || "[]") as { q: string; a: string }[];
  const items = mergeFaqs(fromDb);

  return <FaqClient items={items} />;
}
