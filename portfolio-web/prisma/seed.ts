import "dotenv/config";
import path from "path";
import { hash } from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const dbFile = (process.env.DATABASE_URL || "file:./dev.db").replace(/^file:/, "");
const url = path.isAbsolute(dbFile) ? dbFile : path.join(process.cwd(), dbFile);
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: `file:${url}` }),
});

async function main() {
  await prisma.lead.deleteMany();
  await prisma.projectMedia.deleteMany();
  await prisma.projectCollaborator.deleteMany();
  await prisma.project.deleteMany();
  await prisma.service.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.adminUser.deleteMany();

  const passwordHash = await hash("ChangeMe123!", 10);
  await prisma.adminUser.create({
    data: {
      email: "admin@facksten.local",
      passwordHash,
    },
  });

  await prisma.service.createMany({
    data: [
      {
        slug: "hardware-design",
        titleFa: "طراحی سخت‌افزار",
        titleEn: "Hardware design",
        summaryFa: "برد، پاور و لایه سیگنال برای محصولی که در میدان دوام بیاورد.",
        summaryEn: "Boards, power, and signal layers built to survive the field.",
        bodyFa:
          "از شماتیک تا چیدمان و بازبینی DFM. تمرکز روی نویز، حرارت و قابلیت ساخت در تیراژ محدود. خروجی: فایل ساخت، بوم تست و چک‌لیست مونتاژ.",
        bodyEn:
          "From schematic through layout and DFM review. We focus on noise, heat, and buildability at short-run volumes. Deliverables: fab files, a test jig brief, and an assembly checklist.",
        status: "PUBLISHED",
        sortOrder: 1,
      },
      {
        slug: "firmware-embedded",
        titleFa: "میان‌افزار و امبدد",
        titleEn: "Firmware & embedded",
        summaryFa: "RTOS، درایور و تله‌متری پایدار برای سخت‌افزار زنده.",
        summaryEn: "RTOS, drivers, and stable telemetry for live hardware.",
        bodyFa:
          "بوت‌لودر، به‌روزرسانی امن، لاگ و پروتکل سریال/CAN/MQTT. کد خوانا، قابل تست روی نیمکت، و آماده تحویل به تیم کارخانه.",
        bodyEn:
          "Bootloaders, safe OTA, logs, and serial/CAN/MQTT. Readable firmware that benches cleanly and hands off to a factory team.",
        status: "PUBLISHED",
        sortOrder: 2,
      },
      {
        slug: "industrial-ui",
        titleFa: "رابط صنعتی",
        titleEn: "Industrial UI",
        summaryFa: "هدآپ، پنل و ترمینال — خوانا زیر نور بد و دستکش.",
        summaryEn: "HUDs, panels, and terminals — readable under bad light and gloves.",
        bodyFa:
          "طراحی رابط برای اپراتور، نه دمو. کنتراست بالا، حالت‌های خطا، و جریان کار کوتاه. Cyber DS فکستن برای محصول و پنل داخلی.",
        bodyEn:
          "UI for operators, not demos. High contrast, explicit error states, short task flows. Facksten Cyber DS for product and internal panels.",
        status: "PUBLISHED",
        sortOrder: 3,
      },
      {
        slug: "iot-systems",
        titleFa: "سامانه‌های IoT",
        titleEn: "IoT systems",
        summaryFa: "از سنسور لبه تا داشبورد پایش — یک زنجیره، نه چند جزیره.",
        summaryEn: "Edge sensor to monitoring dashboard — one chain, not islands.",
        bodyFa:
          "معماری ingest، صف و هشدار. دادهٔ میدان را قابل اعتماد و قابل پرس‌وجو می‌کنیم؛ بدون قفل شدن به یک ابر خاص در فاز اول.",
        bodyEn:
          "Ingest, queues, and alerts. Field data becomes trustworthy and queryable — without locking phase one to a single cloud.",
        status: "PUBLISHED",
        sortOrder: 4,
      },
      {
        slug: "studio-consulting",
        titleFa: "مشاوره استودیو",
        titleEn: "Studio consulting",
        summaryFa: "بازبینی معماری، انتخاب قطعه، و نقشهٔ ساخت قبل از هزینهٔ قالب.",
        summaryEn: "Architecture review, part selection, and a build map before tooling spend.",
        bodyFa:
          "جلسات کوتاه، گزارش صریح، و لیست ریسک. مناسب تیم‌هایی که سخت‌افزار را شروع کرده‌اند و به خط قرمز نیاز دارند.",
        bodyEn:
          "Short sessions, blunt reports, and a risk list. For teams already in hardware who need a red-line pass.",
        status: "DRAFT",
        sortOrder: 5,
      },
    ],
  });

  const pulse = await prisma.project.create({
    data: {
      slug: "pulse-rack",
      titleFa: "رک پایش پالس",
      titleEn: "Pulse Rack",
      summaryFa: "رک ۱۹ اینچی برای پایش خط تولید با تله‌متری زنده و هشدار آستانه‌ای.",
      summaryEn: "A 19-inch rack for line monitoring with live telemetry and threshold alerts.",
      bodyFa:
        "Pulse Rack برای کارخانه‌ای طراحی شد که به یک دیوار سیگنال نیاز داشت، نه یک داشبورد تزئینی. سخت‌افزار لبه سیگنال آنالوگ را نمونه‌برداری می‌کند، میان‌افزار بسته‌ها را روی CAN جمع می‌کند، و پنل Cyber وضعیت را با تأخیر زیر یک ثانیه نشان می‌دهد.\n\nخروجی استودیو: برد پاور، ماژول ورودی ۸ کاناله، فریم‌ور قفل‌شده، و رابط اپراتور فارسی.",
      bodyEn:
        "Pulse Rack was built for a plant that needed a signal wall, not a decorative dashboard. Edge hardware samples analog lines, firmware aggregates CAN frames, and the Cyber panel shows state in under a second.\n\nStudio output: a power board, an 8-channel input module, locked firmware, and a Persian operator UI.",
      challengeFa:
        "خط تولید به دیوار سیگنال زنده نیاز داشت؛ داشبورد تزئینی وضعیت آنالوگ را دیر و مبهم نشان می‌داد.",
      challengeEn:
        "The plant needed a live signal wall. A decorative dashboard showed analog state late and vaguely.",
      solutionFa:
        "سخت‌افزار لبه سیگنال آنالوگ را نمونه‌برداری می‌کند، میان‌افزار فریم‌های CAN را جمع می‌کند، و پنل Cyber وضعیت را زیر یک ثانیه نشان می‌دهد.",
      solutionEn:
        "Edge hardware samples analog lines, firmware aggregates CAN frames, and the Cyber panel shows state in under a second.",
      outcomeFa: "برد پاور، ماژول ورودی ۸ کاناله، فریم‌ور قفل‌شده، و رابط اپراتور فارسی تحویل شد.",
      outcomeEn: "Delivered: power board, 8-channel input module, locked firmware, and a Persian operator UI.",
      tagsFa: "پایش خط، رک ۱۹ اینچ، تله‌متری",
      tagsEn: "line monitoring, 19-inch rack, telemetry",
      stack: "CAN, analog I/O, RTOS, Cyber panel",
      coverUrl: "/covers/pulse-rack.svg",
      status: "PUBLISHED",
      featured: true,
      sortOrder: 1,
      media: {
        create: [
          {
            url: "/covers/pulse-rack-hud.svg",
            altFa: "هدآپ رک پالس",
            altEn: "Pulse Rack HUD",
            sortOrder: 1,
          },
          {
            url: "/covers/pulse-rack-bay.svg",
            altFa: "بِی ماژول‌ها",
            altEn: "Module bay",
            sortOrder: 2,
          },
        ],
      },
      collaborators: {
        create: [
          { nameFa: "امیر سارانی", nameEn: "Amir Sarani", roleFa: "سخت‌افزار", roleEn: "Hardware", sortOrder: 1 },
          { nameFa: "نوید کریمی", nameEn: "Navid Karimi", roleFa: "میان‌افزار", roleEn: "Firmware", sortOrder: 2 },
        ],
      },
    },
  });

  const kiln = await prisma.project.create({
    data: {
      slug: "kiln-link",
      titleFa: "لینک کوره",
      titleEn: "Kiln Link",
      summaryFa: "پل حرارتی و لاگ برای کورهٔ آزمایشگاهی با قطع امن در افت سنسور.",
      summaryEn: "A thermal bridge and log for a lab kiln, with a fail-safe on sensor drop.",
      bodyFa:
        "Kiln Link دمای چند نقطه را می‌خواند، پروفایل را نگه می‌دارد، و اگر ترموکوپل قطع شود رله را به حالت امن می‌برد. رابط ترمینال برای تکنسین، نه اپراتور نمایشگاه.",
      bodyEn:
        "Kiln Link reads multi-point temperature, holds a profile, and drives the relay safe if a thermocouple drops. A technician terminal — not a show-floor UI.",
      challengeFa: "افت ترموکوپل در کوره آزمایشگاهی باید رله را قطع امن کند، نه اینکه پروفایل ادامه یابد.",
      challengeEn: "A dropped thermocouple in a lab kiln had to fail the relay safe — not keep running the profile.",
      solutionFa: "خواندن چندنقطه‌ای دما، نگه‌داشت پروفایل، و رفتن رله به حالت امن در قطع سنسور.",
      solutionEn: "Multi-point temperature read, profile hold, and a fail-safe relay on sensor drop.",
      outcomeFa: "ترمینال تکنسین با لاگ حرارتی و قطع امن — بدون رابط نمایشگاهی.",
      outcomeEn: "A technician terminal with a thermal log and fail-safe cutout — not a show-floor UI.",
      tagsFa: "حرارت، ایمنی، آزمایشگاه",
      tagsEn: "thermal, fail-safe, lab",
      stack: "thermocouple, relay, profile log",
      coverUrl: "/covers/kiln-link.svg",
      status: "PUBLISHED",
      featured: false,
      sortOrder: 2,
      collaborators: {
        create: [
          { nameFa: "فاطمه سارانی", nameEn: "Fatemeh Sarani", roleFa: "سیستم و رابط", roleEn: "Systems & UI", sortOrder: 1 },
        ],
      },
    },
  });

  await prisma.project.create({
    data: {
      slug: "field-hud",
      titleFa: "هدآپ میدان",
      titleEn: "Field HUD",
      summaryFa: "نمایشگر دستی برای تیم سرویس: وضعیت گره، سطح باتری، و لاگ خطا.",
      summaryEn: "A handheld display for service crews: node state, battery, and fault log.",
      bodyFa:
        "Field HUD روی تبلت صنعتی اجرا می‌شود. داده از رادیو لبه می‌آید؛ رابط فقط سه کار دارد: پیدا کردن گره، دیدن خطا، ثبت سرویس.",
      bodyEn:
        "Field HUD runs on an industrial tablet. Data comes from the edge radio. The UI does three jobs: find the node, read the fault, log the service.",
      challengeFa: "تیم سرویس در میدان به وضعیت گره، باتری و لاگ خطا نیاز داشت — نه یک اپ عمومی.",
      challengeEn: "Service crews in the field needed node state, battery, and a fault log — not a consumer app.",
      solutionFa: "نمایشگر دستی روی تبلت صنعتی؛ داده از رادیو لبه؛ سه کار: پیدا کردن گره، دیدن خطا، ثبت سرویس.",
      solutionEn: "A handheld on an industrial tablet. Edge-radio data. Three jobs: find the node, read the fault, log the service.",
      outcomeFa: "هدآپ میدان با کنتراست بالا برای دستکش و نور بد.",
      outcomeEn: "A high-contrast field HUD readable with gloves and bad light.",
      tagsFa: "میدان، سرویس، هدآپ",
      tagsEn: "field, service, HUD",
      stack: "edge radio, industrial tablet, Cyber DS",
      coverUrl: "/covers/field-hud.svg",
      status: "PUBLISHED",
      featured: true,
      sortOrder: 3,
      media: {
        create: [
          {
            url: "/covers/field-hud-detail.svg",
            altFa: "جزئیات هدآپ",
            altEn: "HUD detail",
            sortOrder: 1,
          },
        ],
      },
      collaborators: {
        create: [
          { nameFa: "فاطمه سارانی", nameEn: "Fatemeh Sarani", roleFa: "طراحی رابط", roleEn: "UI design", sortOrder: 1 },
          { nameFa: "امیر سارانی", nameEn: "Amir Sarani", roleFa: "پروتکل رادیو", roleEn: "Radio protocol", sortOrder: 2 },
        ],
      },
    },
  });

  await prisma.project.create({
    data: {
      slug: "signal-bench",
      titleFa: "میز سیگنال",
      titleEn: "Signal Bench",
      summaryFa: "نیمکت تست داخلی استودیو برای بردهای ورودی آنالوگ.",
      summaryEn: "Internal studio bench for analog-input boards.",
      bodyFa: "ابزار داخلی؛ هنوز برای انتشار عمومی آماده نیست.",
      bodyEn: "Internal tooling; not ready for a public write-up.",
      coverUrl: "/covers/signal-bench.svg",
      status: "DRAFT",
      featured: false,
      sortOrder: 4,
    },
  });

  void pulse;
  void kiln;

  await prisma.teamMember.createMany({
    data: [
      {
        nameFa: "امیر سارانی",
        nameEn: "Amir Sarani",
        roleFa: "سخت‌افزار و بنیان‌گذار",
        roleEn: "Hardware & founder",
        bioFa: "طراحی برد و معماری سیستم. مسئول خط قرمز ساخت و تحویل کارخانه.",
        bioEn: "Board design and system architecture. Owns the factory red-line and handoff.",
        photoUrl: "/avatars/amir.svg",
        status: "PUBLISHED",
        sortOrder: 1,
      },
      {
        nameFa: "فاطمه سارانی",
        nameEn: "Fatemeh Sarani",
        roleFa: "سیستم و طراحی",
        roleEn: "Systems & design",
        bioFa: "زبان بصری Cyber DS، جریان کار اپراتور، و یکپارچگی محصول با بازار فکستن.",
        bioEn: "Cyber DS language, operator flows, and product coherence with the Facksten market.",
        photoUrl: "/avatars/fatemeh.svg",
        status: "PUBLISHED",
        sortOrder: 2,
      },
      {
        nameFa: "نوید کریمی",
        nameEn: "Navid Karimi",
        roleFa: "میان‌افزار",
        roleEn: "Firmware",
        bioFa: "RTOS، باس صنعتی و تله‌متری. کد را روی نیمکت قفل می‌کند نه روی اسلاید.",
        bioEn: "RTOS, industrial buses, and telemetry. Firmware locks on the bench, not a slide.",
        photoUrl: "/avatars/navid.svg",
        status: "PUBLISHED",
        sortOrder: 3,
      },
    ],
  });

  const settings: Record<string, unknown> = {
    chrome: {
      brand: "Facksten",
      tagline: {
        fa: "استودیو سیستم‌های الکترونیک",
        en: "Electronics systems studio",
      },
    },
    hero: {
      kicker: { fa: "FACKSTEN // STUDIO", en: "FACKSTEN // STUDIO" },
      title: {
        fa: "سیستم می‌سازیم؛ ویترین نمی‌چینیم.",
        en: "We ship systems, not vitrines.",
      },
      lead: {
        fa: "فکستن استودیوی سخت‌افزار، میان‌افزار و رابط صنعتی است. بازار قطعات جداست — اینجا کار ساخته‌شده را می‌بینید.",
        en: "Facksten is a hardware, firmware, and industrial UI studio. The parts market is separate — this site is the built work.",
      },
      ctaPrimary: { fa: "پروژه‌ها", en: "Projects" },
      ctaSecondary: { fa: "درخواست مشاوره", en: "Request a consult" },
    },
    trust: {
      title: { fa: "سیگنال استودیو", en: "Studio signal" },
      lead: {
        fa: "اعداد اولیه از کارهای منتشرشده — ادمین می‌تواند از تنظیمات جایگزین کند.",
        en: "Seed stats from published work — replace later from site settings.",
      },
      stats: [
        { value: "3+", label: { fa: "سامانه منتشرشده", en: "Published systems" } },
        { value: "HW / FW / UI", label: { fa: "حوزه ساخت", en: "Build domains" } },
        { value: "<1s", label: { fa: "تأخیر پنل پایش", en: "Monitoring panel lag" } },
        { value: "FA + EN", label: { fa: "تحویل دوزبانه", en: "Bilingual delivery" } },
      ],
    },
    contact: {
      email: "studio@facksten.com",
      phone: "۰۲۱-۱۲۳۴۵۶۷۸",
      whatsapp: "+989121234567",
      address: { fa: "تهران، خیابان جمهوری", en: "Jomhuri St., Tehran" },
      hours: { fa: "شنبه تا چهارشنبه، ۱۰ تا ۱۸", en: "Sat–Wed, 10:00–18:00" },
    },
    about: {
      title: { fa: "استودیو فکستن", en: "Facksten studio" },
      body: {
        fa: "فکستن دو سطح دارد: بازار قطعات الکترونیک، و استودیوی ساخت سیستم. این سایت متعلق به استودیوست — بدون سبد خرید، بدون حساب بازار. کار ما طراحی برد، میان‌افزار پایدار، و رابط‌هایی است که زیر نور بد خوانده شوند.\n\nفاز اول همین اسکلت است: محتوا از CMS می‌آید، زبان فارسی پیش‌فرض است، انگلیسی موازی است.",
        en: "Facksten has two surfaces: an electronics parts market, and a systems studio. This site is the studio — no cart, no market session. We design boards, stable firmware, and interfaces that stay readable in bad light.\n\nPhase 1 is this skeleton: CMS-driven copy, Persian first, English in parallel.",
      },
    },
    legal: {
      privacy: {
        fa: "فرم تماس نام، ایمیل و متن پیام را ذخیره می‌کند تا استودیو پاسخ دهد. داده را به بازار فکستن وصل نمی‌کنیم و در این فاز عمومی منتشر نمی‌شود.",
        en: "The contact form stores name, email, and message so the studio can reply. We do not share it with the Facksten market. This phase is local-only.",
      },
      terms: {
        fa: "محتوای این سایت نمونهٔ فاز ۱ است. خدمات و پروژه‌ها ممکن است پیش‌نویس باشند. برای کار واقعی از فرم تماس استفاده کنید.",
        en: "This site is a Phase 1 skeleton. Services and projects may be drafts. Use the contact form for real work.",
      },
    },
    footer: {
      blurb: {
        fa: "استودیو فکستن — ساخت سیستم، جدا از فروشگاه.",
        en: "Facksten studio — systems, separate from the shop.",
      },
      marketUrl: "https://facksten.com",
      marketLabel: { fa: "بازار فکستن", en: "Facksten market" },
    },
  };

  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSetting.create({
      data: { key, valueJson: JSON.stringify(value) },
    });
  }

  await prisma.lead.create({
    data: {
      name: "سارا محمدی",
      email: "sara@example.com",
      message: "برای خط بسته‌بندی به رک پایش شبیه Pulse Rack نیاز داریم. امکان جلسه دارید؟",
      locale: "fa",
    },
  });

  console.log("Seeded portfolio CMS (admin@facksten.local / ChangeMe123!)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
