import type { Locale } from "@/lib/locale";

export const dictionary = {
  fa: {
    nav: {
      home: "خانه",
      services: "خدمات",
      projects: "پروژه‌ها",
      about: "درباره ما",
      contact: "تماس",
      shop: "فروشگاه",
    },
    actions: {
      viewAll: "مشاهده همه",
      viewProject: "مشاهده پروژه",
      contact: "شروع گفتگو",
      requestConsult: "درخواست مشاوره",
      wantSimilar: "مشابه این می‌خواهید؟",
      send: "ارسال پیام",
      sending: "در حال ارسال…",
      sent: "پیام ثبت شد. به‌زودی پاسخ می‌دهیم.",
    },
    home: {
      featured: "پروژه‌های منتخب",
      services: "خدمات استودیو",
      team: "تیم فکستن",
      trust: "سیگنال استودیو",
    },
    project: {
      challenge: "مسئله",
      solution: "راه‌حل",
      result: "نتیجه",
      collaborators: "همکاران",
      stack: "استک",
    },
    pages: {
      servicesTitle: "خدمات",
      servicesLead: "از سخت‌افزار تا میان‌افزار و رابط صنعتی — یک خط تولید برای ساخت سیستم.",
      projectsTitle: "پروژه‌ها",
      projectsLead: "کارهای منتشرشده استودیو؛ از رک پایش تا هدآپ میدان.",
      aboutTitle: "درباره فکستن",
      contactTitle: "تماس",
      contactLead: "برای همکاری، مشاوره یا سفارش پروژه پیام بگذارید.",
      privacyTitle: "حریم خصوصی",
      termsTitle: "شرایط استفاده",
    },
    contact: {
      call: "تماس تلفنی",
      email: "ایمیل",
      whatsapp: "واتساپ",
      phone: "تلفن",
      address: "آدرس",
      hours: "ساعات",
    },
    form: {
      name: "نام",
      email: "ایمیل",
      message: "پیام",
      required: "این فیلد لازم است.",
      invalidEmail: "ایمیل نامعتبر است.",
    },
    empty: {
      services: "هنوز خدمت منتشرشده‌ای نیست.",
      projects: "هنوز پروژه‌ای منتشر نشده.",
      team: "هنوز عضوی از تیم منتشر نشده.",
    },
    footer: {
      legal: "حقوقی",
      privacy: "حریم خصوصی",
      terms: "شرایط استفاده",
      market: "بازار فکستن",
    },
    lang: { fa: "فا", en: "EN" },
  },
  en: {
    nav: {
      home: "Home",
      services: "Services",
      projects: "Projects",
      about: "About",
      contact: "Contact",
      shop: "Shop",
    },
    actions: {
      viewAll: "View all",
      viewProject: "Open project",
      contact: "Start a brief",
      requestConsult: "Request a consult",
      wantSimilar: "Want something like this?",
      send: "Send message",
      sending: "Sending…",
      sent: "Message received. We will reply soon.",
    },
    home: {
      featured: "Featured work",
      services: "Studio services",
      team: "The Facksten team",
      trust: "Studio signal",
    },
    project: {
      challenge: "Issue",
      solution: "Solution",
      result: "Result",
      collaborators: "Collaborators",
      stack: "Stack",
    },
    pages: {
      servicesTitle: "Services",
      servicesLead: "Hardware, firmware, and industrial UI — one production line for systems.",
      projectsTitle: "Projects",
      projectsLead: "Published studio work: monitoring racks, kiln links, field HUDs.",
      aboutTitle: "About Facksten",
      contactTitle: "Contact",
      contactLead: "For collaboration, consulting, or a build brief.",
      privacyTitle: "Privacy",
      termsTitle: "Terms",
    },
    contact: {
      call: "Call",
      email: "Email",
      whatsapp: "WhatsApp",
      phone: "Phone",
      address: "Address",
      hours: "Hours",
    },
    form: {
      name: "Name",
      email: "Email",
      message: "Message",
      required: "This field is required.",
      invalidEmail: "Enter a valid email.",
    },
    empty: {
      services: "No published services yet.",
      projects: "No published projects yet.",
      team: "No published team members yet.",
    },
    footer: {
      legal: "Legal",
      privacy: "Privacy",
      terms: "Terms",
      market: "Facksten market",
    },
    lang: { fa: "فا", en: "EN" },
  },
} as const;

export type Dictionary = (typeof dictionary)[Locale];

export function t(locale: Locale): Dictionary {
  return dictionary[locale];
}
