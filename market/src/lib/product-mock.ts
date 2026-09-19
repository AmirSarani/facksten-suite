import { formatToman } from "@/lib/format";

export type MockReview = {
  id: string;
  rating: number;
  body: string;
  user: { name: string };
  createdAt?: string;
};

export type MockQa = {
  id: string;
  question: string;
  answer: string;
  asker: string;
  daysAgo: number;
};

export type MockDownload = {
  id: string;
  name: string;
  url: string;
  meta: string;
  icon: "picture_as_pdf" | "account_tree" | "folder_zip";
  tone: string;
};

const MOCK_REVIEWERS = [
  "نیما کریمی",
  "فاطمه موسوی",
  "حسین اکبری",
  "مریم جعفری",
  "امیرحسین نوری",
  "زهرا کاظمی",
  "محمد قاسمی",
  "یاسمن رستمی",
  "پارسا محمدی",
  "الهام صادقی",
  "کیانوش احمدی",
  "سحر طاهری",
];

const REVIEW_BODIES = [
  "کیفیت ساخت عالی بود و دقیقاً مطابق توضیحات سایت رسید. بسته‌بندی هم محکم بود.",
  "برای پروژه دانشجویی خریدم؛ بدون مشکل کار کرد و پشتیبانی فنی پاسخگو بود.",
  "ارسال سریع، محصول اورجینال. از خرید راضی‌ام و دوباره هم سفارش می‌دهم.",
  "نسبت به قیمت، ارزش خرید بالایی دارد. پیشنهاد می‌کنم قبل از خرید مشخصات را کامل بخوانید.",
  "مستندات همراه کمک زیادی کرد. راه‌اندازی در کمتر از یک ساعت انجام شد.",
  "ظاهر و عملکرد خوب است. فقط کاش تعداد بیشتری لوازم جانبی داخل بسته بود.",
  "با برد دیگری که قبلاً داشتم مقایسه کردم؛ این نسخه پایدارتر کار می‌کند.",
  "برای کارگاه آموزشی تهیه کردیم. همه نمونه‌ها سالم و یکدست بودند.",
  "اتصال و پین‌ها استاندارد است. با کتابخانه رایج بدون دردسر راه افتاد.",
  "تجربه خرید از Facksten خوب بود؛ رهگیری سفارش شفاف و به‌موقع بود.",
];

/** Deterministic pseudo-random from slug */
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function mockReviewsForProduct(
  slug: string,
  existing: MockReview[],
  minCount = 8,
): MockReview[] {
  if (existing.length >= minCount) return existing;
  const h = hash(slug);
  const needed = minCount - existing.length;
  const extras: MockReview[] = [];
  for (let i = 0; i < needed; i++) {
    const rating = [5, 5, 4, 5, 3, 4, 5, 4][(h + i) % 8];
    extras.push({
      id: `mock-rev-${slug}-${i}`,
      rating,
      body: REVIEW_BODIES[(h + i) % REVIEW_BODIES.length],
      user: { name: MOCK_REVIEWERS[(h + i * 3) % MOCK_REVIEWERS.length] },
      createdAt: new Date(Date.now() - (i + 2) * 86400000 * ((h % 3) + 1)).toISOString(),
    });
  }
  return [...existing, ...extras];
}

export function mockQaForProduct(slug: string, title: string, brand?: string | null): MockQa[] {
  const b = brand || "Facksten";
  return [
    {
      id: "qa1",
      question: `آیا «${title}» گارانتی اصالت دارد؟`,
      answer: "بله؛ تمام کالاهای سخت‌افزاری با گارانتی اصالت و سلامت فیزیکی Facksten عرضه می‌شوند.",
      asker: "کاربر مهمان",
      daysAgo: 12,
    },
    {
      id: "qa2",
      question: "زمان ارسال به شهرستان چقدر است؟",
      answer: "ارسال از انبار تهران معمولاً ۱ تا ۳ روز کاری برای مراکز استان و ۳ تا ۵ روز برای سایر شهرهاست.",
      asker: "رضا م.",
      daysAgo: 8,
    },
    {
      id: "qa3",
      question: `با بردهای ${b} دیگر سازگار است؟`,
      answer: "بله؛ در اکثر پروژه‌های استاندارد آموزشی و نمونه‌سازی سازگاری کامل دارد. جزئیات در بخش مشخصات فنی آمده است.",
      asker: "سارا ک.",
      daysAgo: 5,
    },
    {
      id: "qa4",
      question: "آیا فاکتور رسمی صادر می‌شود؟",
      answer: "برای خریدهای سازمانی از طریق تیکت پشتیبانی درخواست فاکتور رسمی ثبت کنید.",
      asker: "شرکت نوآوران",
      daysAgo: 3,
    },
    {
      id: "qa5",
      question: "در صورت مغایرت کالا چه باید کرد؟",
      answer: "تا ۷ روز کاری می‌توانید از پنل کاربری تیکت مرجوعی باز کنید؛ پس از تأیید، تعویض یا بازگشت وجه انجام می‌شود.",
      asker: "نیما ر.",
      daysAgo: 1,
    },
  ];
}

export function mockDownloadsForProduct(
  slug: string,
  type: string,
  existing: { id: string; name: string; url: string }[],
): MockDownload[] {
  const fromDb: MockDownload[] = existing.map((f, i) => {
    const isPdf = f.name.toLowerCase().includes("pdf");
    return {
      id: f.id,
      name: f.name,
      url: f.url,
      meta: i === 0 ? "فایل محصول · آماده دانلود" : "مستندات همراه",
      icon: isPdf ? "picture_as_pdf" : type === "DIGITAL" ? "folder_zip" : "account_tree",
      tone: isPdf
        ? "bg-error-container text-error"
        : "bg-surface-container-highest text-on-surface-variant",
    };
  });

  const defaults: MockDownload[] = [
    {
      id: `ds-${slug}`,
      name: "دیتاشیت کامل محصول (PDF)",
      url: "/downloads/sample-esp32.txt",
      meta: "نسخه انگلیسی · ۲.۴ MB",
      icon: "picture_as_pdf",
      tone: "bg-error-container text-error",
    },
    {
      id: `sch-${slug}`,
      name: "نقشه شماتیک و پین‌اوت",
      url: "/downloads/sample-pcb.txt",
      meta: "PDF + تصویر · ۱.۱ MB",
      icon: "account_tree",
      tone: "bg-surface-container-highest text-on-surface-variant",
    },
    {
      id: `guide-${slug}`,
      name: "راهنمای راه‌اندازی سریع فارسی",
      url: "/downloads/sample-smarthome.txt",
      meta: "PDF فارسی · ۸۵۰ KB",
      icon: "picture_as_pdf",
      tone: "bg-error-container text-error",
    },
    {
      id: `ex-${slug}`,
      name: type === "DIGITAL" ? "نمونه پروژه و فایل‌های جانبی" : "کد نمونه و کتابخانه‌ها",
      url: "/downloads/sample-esp32.txt",
      meta: "ZIP · ۳.۲ MB",
      icon: "folder_zip",
      tone: "bg-primary-container/15 text-primary-container",
    },
  ];

  const merged = [...fromDb];
  for (const d of defaults) {
    if (merged.length >= 4) break;
    if (!merged.some((m) => m.name === d.name)) merged.push(d);
  }
  return merged.slice(0, 4);
}

export function enrichDescription(description: string, title: string, brand?: string | null) {
  const base = description?.trim() || `${title} یکی از محصولات منتخب فروشگاه Facksten است.`;
  const extras = [
    `نسخه عرضه‌شده در Facksten با کنترل کیفیت ورودی بررسی می‌شود و برای استفاده در محیط آموزشی و نمونه‌سازی صنعتی سبک مناسب است.`,
    brand
      ? `برند ${brand} در بازار ایران شناخته‌شده است و مستندات رسمی آن در بخش دانلودها در دسترس قرار گرفته است.`
      : `مستندات راهنما، دیتاشیت و فایل‌های نمونه در بخش دانلودها قرار دارد.`,
    `در صورت نیاز به مشاوره انتخاب قطعه یا راه‌اندازی، از تیکت پشتیبانی یا بخش پرسش و پاسخ همین صفحه استفاده کنید.`,
  ];
  if (base.length > 400) return base;
  return [base, ...extras].join("\n\n");
}

export function ratingSummary(reviews: MockReview[]) {
  const total = reviews.length || 1;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / total;
  const buckets = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: Math.round((reviews.filter((r) => r.rating === star).length / total) * 100),
  }));
  return { avg, total: reviews.length, buckets };
}

export function formatReviewDate(iso?: string) {
  if (!iso) return "اخیراً";
  try {
    return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long", day: "numeric" }).format(
      new Date(iso),
    );
  } catch {
    return "اخیراً";
  }
}

export function formatPriceHint(price: number) {
  return `${formatToman(price)} تومان`;
}
