import "dotenv/config";
import path from "path";
import { hash } from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import {
  OrderStatus,
  PrismaClient,
  ProductType,
  Role,
  TicketStatus,
} from "../src/generated/prisma/client";
import { ARTICLE_BODIES } from "../src/lib/article-bodies";
import { ARTICLE_IMAGES, resolveProductImage } from "../src/lib/media";
import { buildProductSeeds, CATEGORY_TREE } from "./seed-catalog-data";

const dbFile = (process.env.DATABASE_URL || "file:./dev.db").replace(/^file:/, "");
const dbPath = path.isAbsolute(dbFile) ? dbFile : path.join(process.cwd(), dbFile);
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

async function main() {
  await prisma.ticketMessage.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productFile.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.article.deleteMany();
  await prisma.user.deleteMany();
  await prisma.siteSetting.deleteMany();

  const passwordHash = await hash("Pass123!", 10);

  const admin = await prisma.user.create({
    data: {
      name: "ادمین فکستن",
      email: "admin@facksten.com",
      phone: "09120000001",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const partner = await prisma.user.create({
    data: {
      name: "مریم شریفی",
      email: "partner@facksten.com",
      phone: "09120000002",
      passwordHash,
      role: Role.PARTNER,
    },
  });

  const partner2 = await prisma.user.create({
    data: {
      name: "نماینده اصفهان",
      email: "partner2@facksten.com",
      phone: "09131112233",
      passwordHash,
      role: Role.PARTNER,
    },
  });

  const customer = await prisma.user.create({
    data: {
      name: "علی احمدی",
      email: "user@facksten.com",
      phone: "09123456789",
      passwordHash,
      role: Role.CUSTOMER,
      addresses: {
        create: [
          {
            label: "خانه",
            line: "تهران، خیابان آزادی، کوچه گلستان، پلاک ۱۲، واحد ۳",
            phone: "09123456789",
            isDefault: true,
          },
          {
            label: "محل کار",
            line: "تهران، خیابان ولیعصر، برج فناوری، طبقه ۸",
            phone: "02188990011",
          },
        ],
      },
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: "سارا رضایی",
      email: "sara@facksten.com",
      phone: "09121234567",
      passwordHash,
      role: Role.CUSTOMER,
      addresses: {
        create: [
          {
            label: "منزل",
            line: "اصفهان، خیابان چهارباغ، پلاک ۴۵",
            phone: "09121234567",
            isDefault: true,
          },
        ],
      },
    },
  });

  const customer3 = await prisma.user.create({
    data: {
      name: "رضا محمدی",
      email: "reza@facksten.com",
      phone: "09351234567",
      passwordHash,
      role: Role.CUSTOMER,
    },
  });

  const categoryBySlug = new Map<string, string>();

  for (const root of CATEGORY_TREE) {
    const parent = await prisma.category.create({
      data: {
        slug: root.slug,
        name: root.name,
        intro: root.intro,
        icon: root.icon,
        sortOrder: root.sortOrder,
        isPassive: Boolean(root.isPassive),
      },
    });
    categoryBySlug.set(parent.slug, parent.id);

    for (const child of root.children ?? []) {
      const created = await prisma.category.create({
        data: {
          slug: child.slug,
          name: child.name,
          intro: child.intro,
          icon: child.icon,
          sortOrder: child.sortOrder,
          isPassive: Boolean(child.isPassive),
          parentId: parent.id,
        },
      });
      categoryBySlug.set(created.slug, created.id);
    }
  }

  const sellerMap = {
    partner: partner.id,
    partner2: partner2.id,
  } as const;

  const productSeeds = buildProductSeeds();
  const createdProducts = [];

  for (const p of productSeeds) {
    const categoryId = categoryBySlug.get(p.categorySlug);
    if (!categoryId) throw new Error(`Missing category ${p.categorySlug} for ${p.slug}`);

    const type = p.type === "DIGITAL" ? ProductType.DIGITAL : ProductType.HARDWARE;
    const image = resolveProductImage({
      slug: p.slug,
      categorySlug: p.categorySlug,
      type,
      explicit: p.image,
    });

    const created = await prisma.product.create({
      data: {
        slug: p.slug,
        title: p.title,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        type,
        brand: p.brand ?? null,
        sku: p.sku,
        mpn: p.mpn ?? null,
        packQty: p.packQty ?? 1,
        specs: JSON.stringify(p.specs ?? {}),
        categoryId,
        stock: p.stock,
        inStock: p.inStock ?? p.stock > 0,
        badge: p.badge ?? null,
        isNew: Boolean(p.isNew),
        isPopular: Boolean(p.isPopular),
        isFeatured: Boolean(p.isFeatured),
        image,
        icon: p.icon ?? null,
        fileLabel: p.fileLabel ?? null,
        fileSize: p.fileSize ?? null,
        description: p.description,
        sellerId: p.seller ? sellerMap[p.seller] : null,
        files: p.files?.length ? { create: p.files } : undefined,
      },
    });
    createdProducts.push(created);
  }

  const bySlug = Object.fromEntries(createdProducts.map((p) => [p.slug, p]));

  await prisma.article.createMany({
    data: [
      {
        slug: "iot-arduino-guide",
        title: "آموزش جامع اینترنت اشیا (IoT) با بردهای آردوینو",
        excerpt:
          "از اتصال سنسور تا ارسال داده به داشبورد ابری، قدم‌به‌قدم با آردوینو و ESP مسیر ساخت اولین گره IoT را طی می‌کنیم.",
        body: ARTICLE_BODIES["iot-arduino-guide"],
        category: "اینترنت اشیا",
        dateLabel: "۲۴ مهر ۱۴۰۳",
        image: ARTICLE_IMAGES["iot-arduino-guide"] ?? "/placeholder.svg",
      },
      {
        slug: "arduino-boards-comparison",
        title: "بررسی و مقایسه بردهای آردوینو جدید در بازار",
        excerpt: "Uno R4، Nano 33 و Mega را از نظر حافظه، پین و قیمت مقایسه می‌کنیم.",
        body: ARTICLE_BODIES["arduino-boards-comparison"],
        category: "بررسی تخصصی",
        dateLabel: "۱۸ مهر ۱۴۰۳",
        image: ARTICLE_IMAGES["arduino-boards-comparison"] ?? "/placeholder.svg",
      },
      {
        slug: "smd-soldering-guide",
        title: "راهنمای جامع لحیم‌کاری قطعات SMD",
        excerpt: "ابزار، دما، فلاکس و تکنیک‌های رفع پل لحیم برای قطعات ریز.",
        body: ARTICLE_BODIES["smd-soldering-guide"],
        category: "آموزش کاربردی",
        dateLabel: "۱۰ مهر ۱۴۰۳",
        image: ARTICLE_IMAGES["smd-soldering-guide"] ?? "/placeholder.svg",
      },
      {
        slug: "esp32-mqtt-tips",
        title: "۱۰ نکته بهینه‌سازی مصرف باتری در ESP32",
        excerpt: "Deep Sleep، Wi-Fi modem sleep و انتخاب سنسور کم‌مصرف.",
        body: ARTICLE_BODIES["esp32-mqtt-tips"],
        category: "اینترنت اشیا",
        dateLabel: "۲ مهر ۱۴۰۳",
        image: ARTICLE_IMAGES["esp32-mqtt-tips"] ?? "/placeholder.svg",
      },
      {
        slug: "raspberry-pi-homelab",
        title: "راه‌اندازی هوم‌لب با Raspberry Pi 4",
        excerpt: "نصب Docker، Portainer و سرویس‌های مانیتورینگ خانگی.",
        body: ARTICLE_BODIES["raspberry-pi-homelab"],
        category: "سیستم‌عامل و لینوکس",
        dateLabel: "۲۵ شهریور ۱۴۰۳",
        image: ARTICLE_IMAGES["raspberry-pi-homelab"] ?? "/placeholder.svg",
      },
      {
        slug: "pcb-design-checklist",
        title: "چک‌لیست طراحی PCB قبل از ارسال به ساخت",
        excerpt: "فاصله ترک، Ground Plane، سیلک‌اسکرین و خروجی Gerber.",
        body: ARTICLE_BODIES["pcb-design-checklist"],
        category: "طراحی سخت‌افزار",
        dateLabel: "۱۲ شهریور ۱۴۰۳",
        image: ARTICLE_IMAGES["pcb-design-checklist"] ?? "/placeholder.svg",
      },
    ],
  });

  await prisma.siteSetting.create({
    data: {
      id: "main",
      phone: "۰۲۱-۱۲۳۴۵۶۷۸",
      email: "info@facksten.com",
      address: "تهران، خیابان جمهوری، پلاک ۲۱۰",
      faqJson: JSON.stringify([
        {
          q: "هزینه ارسال چقدر است؟",
          a: "برای سفارش‌های بالای یک میلیون تومان ارسال رایگان است. در غیر این صورت هزینه بر اساس شهر مقصد محاسبه می‌شود.",
        },
        {
          q: "محصولات دیجیتال چگونه تحویل می‌شوند؟",
          a: "پس از پرداخت موفق، فایل‌ها بلافاصله در بخش «دانلودها»ی پنل کاربری فعال می‌شوند.",
        },
        {
          q: "گارانتی اصالت کالا دارید؟",
          a: "بله؛ سخت‌افزارهای اورجینال با ضمانت اصالت و سلامت فیزیکی عرضه می‌شوند.",
        },
        {
          q: "چطور سفارش را پیگیری کنم؟",
          a: "از منوی بالای سایت یا پنل کاربری → سفارش‌ها می‌توانید وضعیت ارسال را ببینید.",
        },
        {
          q: "آیا فاکتور رسمی صادر می‌شود؟",
          a: "برای خریدهای سازمانی با ثبت درخواست در تیکت پشتیبانی، فاکتور رسمی صادر می‌شود.",
        },
        {
          q: "نماینده فروش چگونه ثبت‌نام کند؟",
          a: "از طریق فرم تماس یا ایمیل partner@facksten.com درخواست همکاری ارسال کنید تا اکانت PARTNER ساخته شود.",
        },
        {
          q: "مهلت مرجوعی چقدر است؟",
          a: "۷ روز کاری برای کالاهای پلمب‌نشده سخت‌افزاری، در صورت ایراد فنی یا مغایرت.",
        },
        {
          q: "رمز عبور را فراموش کرده‌ام",
          a: "در نسخه فعلی با پشتیبانی تیکت بزنید؛ در نسخه‌های بعدی بازیابی ایمیل اضافه می‌شود.",
        },
      ]),
    },
  });

  const extraCustomers = [];
  for (let i = 0; i < 10; i++) {
    extraCustomers.push(
      await prisma.user.create({
        data: {
          name: [
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
          ][i],
          email: `buyer${i + 1}@facksten.com`,
          phone: `0912${String(1000000 + i).slice(1)}`,
          passwordHash,
          role: Role.CUSTOMER,
        },
      }),
    );
  }

  const allCustomers = [customer, customer2, customer3, ...extraCustomers];
  const reviewBodies = [
    "کیفیت ساخت عالی بود و دقیقاً مطابق توضیحات سایت رسید.",
    "برای پروژه دانشجویی خریدم؛ بدون مشکل کار کرد.",
    "ارسال سریع، محصول اورجینال. از خرید راضی‌ام.",
    "نسبت به قیمت ارزش خرید بالایی دارد.",
    "مستندات همراه کمک زیادی کرد.",
    "ظاهر و عملکرد خوب است.",
    "با نمونه‌های قبلی مقایسه کردم؛ پایدارتر کار می‌کند.",
    "برای کارگاه آموزشی تهیه کردیم؛ همه سالم بودند.",
  ];

  const reviewTargets = createdProducts.filter((p) => p.isPopular || p.isFeatured || p.type === "DIGITAL").slice(0, 40);
  let revIdx = 0;
  for (const p of reviewTargets) {
    const count = p.type === "HARDWARE" ? 3 : 2;
    for (let i = 0; i < count; i++) {
      const u = allCustomers[(revIdx + i) % allCustomers.length];
      try {
        await prisma.review.create({
          data: {
            userId: u.id,
            productId: p.id,
            rating: [5, 4, 5, 3, 5, 4][(revIdx + i) % 6],
            body: reviewBodies[(revIdx + i) % reviewBodies.length],
            createdAt: daysAgo((revIdx + i) % 40),
          },
        });
      } catch {
        /* unique constraint skip */
      }
    }
    revIdx += 1;
  }

  for (const slug of ["arduino-uno-r3", "esp32-wroom", "stm32-bluepill", "raspberry-pi-4-8gb"]) {
    const p = bySlug[slug];
    if (!p) continue;
    await prisma.productFile.createMany({
      data: [
        { productId: p.id, name: "datasheet.pdf", url: "/downloads/sample-esp32.txt" },
        { productId: p.id, name: "schematic.pdf", url: "/downloads/sample-pcb.txt" },
      ],
    });
  }

  await prisma.wishlistItem.createMany({
    data: [
      { userId: customer.id, productId: bySlug["raspberry-pi-4-8gb"].id },
      { userId: customer.id, productId: bySlug["logic-analyzer-8ch"].id },
      { userId: customer.id, productId: bySlug["iot-dashboard-ui"].id },
      { userId: customer.id, productId: bySlug["mpu6050"].id },
    ],
  });

  await prisma.cartItem.createMany({
    data: [
      { userId: customer.id, productId: bySlug["arduino-uno-r3"].id, qty: 1 },
      { userId: customer.id, productId: bySlug["esp32-wroom"].id, qty: 2 },
      { userId: customer.id, productId: bySlug["dht22"].id, qty: 1 },
    ],
  });

  async function makeOrder(opts: {
    code: string;
    userId: string;
    status: OrderStatus;
    days: number;
    paymentMethod: string;
    items: { slug: string; qty: number }[];
    shipping?: { name: string; phone: string; addr: string };
  }) {
    const lines = opts.items.map((i) => {
      const p = bySlug[i.slug];
      return {
        productId: p.id,
        title: p.title,
        price: p.price,
        qty: i.qty,
        type: p.type,
      };
    });
    const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
    return prisma.order.create({
      data: {
        code: opts.code,
        userId: opts.userId,
        status: opts.status,
        total,
        paymentMethod: opts.paymentMethod,
        shippingName: opts.shipping?.name ?? "علی احمدی",
        shippingPhone: opts.shipping?.phone ?? "09123456789",
        shippingAddr: opts.shipping?.addr ?? "تهران، خیابان آزادی، پلاک ۱۲",
        createdAt: daysAgo(opts.days),
        updatedAt: daysAgo(opts.days),
        items: { create: lines },
      },
    });
  }

  const orderShipped = await makeOrder({
    code: "FK-84920",
    userId: customer.id,
    status: OrderStatus.SHIPPED,
    days: 2,
    paymentMethod: "زرین‌پال (آزمایشی)",
    items: [
      { slug: "arduino-nano", qty: 1 },
      { slug: "oled-128x64", qty: 2 },
    ],
  });

  await makeOrder({
    code: "FK-84110",
    userId: customer.id,
    status: OrderStatus.COMPLETED,
    days: 18,
    paymentMethod: "ملت (آزمایشی)",
    items: [
      { slug: "esp32-controller-source", qty: 1 },
      { slug: "arduino-smart-home", qty: 1 },
    ],
  });

  await makeOrder({
    code: "FK-83801",
    userId: customer.id,
    status: OrderStatus.COMPLETED,
    days: 35,
    paymentMethod: "زرین‌پال (آزمایشی)",
    items: [{ slug: "hc-sr04", qty: 3 }],
  });

  await makeOrder({
    code: "FK-83550",
    userId: customer.id,
    status: OrderStatus.PROCESSING,
    days: 1,
    paymentMethod: "زرین‌پال (آزمایشی)",
    items: [{ slug: "mpu6050", qty: 1 }],
  });

  await makeOrder({
    code: "FK-83002",
    userId: customer.id,
    status: OrderStatus.CANCELLED,
    days: 40,
    paymentMethod: "پرداخت در محل",
    items: [{ slug: "breadboard-830", qty: 2 }],
  });

  await makeOrder({
    code: "FK-92001",
    userId: customer2.id,
    status: OrderStatus.PAID,
    days: 1,
    paymentMethod: "زرین‌پال (آزمایشی)",
    shipping: { name: "سارا رضایی", phone: "09121234567", addr: "اصفهان، چهارباغ ۴۵" },
    items: [
      { slug: "arduino-uno-r3", qty: 2 },
      { slug: "l298n-driver", qty: 1 },
    ],
  });

  await makeOrder({
    code: "FK-92044",
    userId: customer2.id,
    status: OrderStatus.COMPLETED,
    days: 12,
    paymentMethod: "ملت (آزمایشی)",
    shipping: { name: "سارا رضایی", phone: "09121234567", addr: "اصفهان، چهارباغ ۴۵" },
    items: [{ slug: "iot-dashboard-ui", qty: 1 }],
  });

  await makeOrder({
    code: "FK-93110",
    userId: customer3.id,
    status: OrderStatus.PROCESSING,
    days: 3,
    paymentMethod: "زرین‌پال (آزمایشی)",
    shipping: { name: "رضا محمدی", phone: "09351234567", addr: "شیراز، ستارخان ۱۲" },
    items: [
      { slug: "stm32-bluepill", qty: 4 },
      { slug: "logic-analyzer-8ch", qty: 1 },
    ],
  });

  await makeOrder({
    code: "FK-93155",
    userId: customer3.id,
    status: OrderStatus.PENDING,
    days: 0,
    paymentMethod: "پرداخت در محل",
    shipping: { name: "رضا محمدی", phone: "09351234567", addr: "شیراز، ستارخان ۱۲" },
    items: [{ slug: "pid-motor-lab", qty: 1 }],
  });

  const extraOrders: {
    code: string;
    userId: string;
    status: OrderStatus;
    days: number;
    items: { slug: string; qty: number }[];
  }[] = [
    { code: "FK-94201", userId: customer.id, status: OrderStatus.COMPLETED, days: 4, items: [{ slug: "arduino-uno-r3", qty: 2 }, { slug: "dht22", qty: 3 }] },
    { code: "FK-94208", userId: customer2.id, status: OrderStatus.COMPLETED, days: 5, items: [{ slug: "esp32-devkit-c", qty: 2 }] },
    { code: "FK-94215", userId: customer3.id, status: OrderStatus.SHIPPED, days: 6, items: [{ slug: "mod-lm2596", qty: 4 }, { slug: "header-male-40", qty: 2 }] },
    { code: "FK-94222", userId: customer.id, status: OrderStatus.COMPLETED, days: 7, items: [{ slug: "oled-128x64", qty: 3 }] },
    { code: "FK-94229", userId: customer2.id, status: OrderStatus.PAID, days: 0, items: [{ slug: "multimeter-aneng", qty: 1 }] },
    { code: "FK-94236", userId: customer3.id, status: OrderStatus.COMPLETED, days: 9, items: [{ slug: "hc-sr04", qty: 5 }, { slug: "dupont-jumper-65", qty: 2 }] },
    { code: "FK-94243", userId: customer.id, status: OrderStatus.PROCESSING, days: 2, items: [{ slug: "raspberry-pi-zero-2w", qty: 1 }] },
    { code: "FK-94250", userId: customer2.id, status: OrderStatus.COMPLETED, days: 11, items: [{ slug: "arduino-nano", qty: 3 }] },
    { code: "FK-94257", userId: customer3.id, status: OrderStatus.COMPLETED, days: 13, items: [{ slug: "esp32-controller-source", qty: 1 }] },
    { code: "FK-94264", userId: customer.id, status: OrderStatus.SHIPPED, days: 8, items: [{ slug: "soldering-iron-60w", qty: 1 }, { slug: "solder-wire-100g", qty: 2 }] },
    { code: "FK-94271", userId: customer2.id, status: OrderStatus.COMPLETED, days: 15, items: [{ slug: "mpu6050", qty: 2 }, { slug: "breadboard-830", qty: 1 }] },
    { code: "FK-94278", userId: customer3.id, status: OrderStatus.COMPLETED, days: 17, items: [{ slug: "adapter-12v-1a", qty: 2 }] },
    { code: "FK-94285", userId: customer.id, status: OrderStatus.COMPLETED, days: 19, items: [{ slug: "relay-5v-1ch", qty: 4 }] },
    { code: "FK-94292", userId: customer2.id, status: OrderStatus.COMPLETED, days: 21, items: [{ slug: "wemos-d1-mini", qty: 2 }] },
    { code: "FK-94299", userId: customer3.id, status: OrderStatus.COMPLETED, days: 23, items: [{ slug: "logic-analyzer-8ch", qty: 1 }] },
    { code: "FK-94306", userId: customer.id, status: OrderStatus.COMPLETED, days: 25, items: [{ slug: "cap-elec-100uf-16v", qty: 10 }] },
    { code: "FK-94313", userId: customer2.id, status: OrderStatus.COMPLETED, days: 27, items: [{ slug: "arduino-smart-home", qty: 1 }] },
    { code: "FK-94320", userId: customer3.id, status: OrderStatus.PENDING, days: 0, items: [{ slug: "stm32-bluepill", qty: 2 }] },
    { code: "FK-94327", userId: customer.id, status: OrderStatus.COMPLETED, days: 14, items: [{ slug: "servo-sg90", qty: 3 }] },
    { code: "FK-94334", userId: customer2.id, status: OrderStatus.CANCELLED, days: 10, items: [{ slug: "battery-18650", qty: 4 }] },
  ];

  for (const o of extraOrders) {
    const known = o.items.every((i) => bySlug[i.slug]);
    if (!known) continue;
    await makeOrder({
      code: o.code,
      userId: o.userId,
      status: o.status,
      days: o.days,
      paymentMethod: "زرین‌پال (آزمایشی)",
      items: o.items,
    });
  }

  await prisma.ticket.create({
    data: {
      code: "TK-1001",
      userId: customer.id,
      orderId: orderShipped.id,
      subject: "پیگیری زمان تحویل سفارش FK-84920",
      status: TicketStatus.ANSWERED,
      createdAt: daysAgo(1),
      messages: {
        create: [
          {
            userId: customer.id,
            body: "سلام، سفارش من دیروز ارسال شده. تقریبی کی به تهران می‌رسد؟",
            isStaff: false,
            createdAt: daysAgo(1),
          },
          {
            userId: admin.id,
            body: "سلام علی عزیز، طبق رهگیری پست، فردا تا ظهر تحویل می‌شود.",
            isStaff: true,
            createdAt: daysAgo(1),
          },
        ],
      },
    },
  });

  await prisma.ticket.create({
    data: {
      code: "TK-1002",
      userId: customer.id,
      subject: "درخواست فاکتور رسمی برای خرید سازمانی",
      status: TicketStatus.OPEN,
      createdAt: daysAgo(0),
      messages: {
        create: [
          {
            userId: customer.id,
            body: "لطفاً برای سفارش‌های تکمیل‌شده من فاکتور رسمی با شناسه ملی شرکت صادر کنید.",
            isStaff: false,
          },
        ],
      },
    },
  });

  await prisma.ticket.create({
    data: {
      code: "TK-1003",
      userId: customer2.id,
      subject: "مغایرت موجودی محصول در پنل همکار",
      status: TicketStatus.OPEN,
      createdAt: daysAgo(2),
      messages: {
        create: [
          {
            userId: customer2.id,
            body: "روی سایت Raspberry Pi ناموجود است ولی در فاکتور قبلی موجود بود.",
            isStaff: false,
            createdAt: daysAgo(2),
          },
          {
            userId: partner.id,
            body: "در حال هماهنگی با انبار هستیم؛ به‌محض تأمین، وضعیت به‌روز می‌شود.",
            isStaff: true,
            createdAt: daysAgo(1),
          },
        ],
      },
    },
  });

  await prisma.ticket.create({
    data: {
      code: "TK-1004",
      userId: customer3.id,
      subject: "مشکل دانلود فایل پروژه FPGA",
      status: TicketStatus.CLOSED,
      createdAt: daysAgo(10),
      messages: {
        create: [
          {
            userId: customer3.id,
            body: "لینک دانلود بعد از خرید کار نمی‌کند.",
            isStaff: false,
            createdAt: daysAgo(10),
          },
          {
            userId: admin.id,
            body: "لینک اصلاح شد. از بخش دانلودها دوباره امتحان کنید.",
            isStaff: true,
            createdAt: daysAgo(9),
          },
          {
            userId: customer3.id,
            body: "مشکل حل شد، ممنون.",
            isStaff: false,
            createdAt: daysAgo(9),
          },
        ],
      },
    },
  });

  await prisma.ticket.create({
    data: {
      code: "TK-1005",
      userId: partner.id,
      subject: "تأخیر تسویه سهم فروش همکار",
      status: TicketStatus.OPEN,
      createdAt: daysAgo(3),
      messages: {
        create: [
          {
            userId: partner.id,
            body: "تسویه ماه قبل هنوز واریز نشده؛ لطفاً وضعیت را اعلام کنید.",
            isStaff: false,
            createdAt: daysAgo(3),
          },
        ],
      },
    },
  });

  await prisma.ticket.create({
    data: {
      code: "TK-1006",
      userId: customer2.id,
      subject: "مغایرت مشخصات ماژول LM2596",
      status: TicketStatus.OPEN,
      createdAt: daysAgo(4),
      messages: {
        create: [
          {
            userId: customer2.id,
            body: "روی صفحه ۳ آمپر نوشته ولی روی برد لیبل ۱٫۵ آمپر است.",
            isStaff: false,
            createdAt: daysAgo(4),
          },
        ],
      },
    },
  });

  await prisma.ticket.create({
    data: {
      code: "TK-1007",
      userId: customer.id,
      orderId: orderShipped.id,
      subject: "درخواست تغییر آدرس ارسال سفارش",
      status: TicketStatus.ANSWERED,
      createdAt: daysAgo(2),
      messages: {
        create: [
          {
            userId: customer.id,
            body: "آیا می‌توان آدرس تحویل را قبل از رسیدن به پست تغییر داد؟",
            isStaff: false,
            createdAt: daysAgo(2),
          },
          {
            userId: admin.id,
            body: "متأسفانه پس از تحویل به پست امکان تغییر آدرس نیست؛ می‌توانید با مرکز پست هماهنگ کنید.",
            isStaff: true,
            createdAt: daysAgo(1),
          },
        ],
      },
    },
  });

  await prisma.ticket.create({
    data: {
      code: "TK-1008",
      userId: partner.id,
      subject: "به‌روزرسانی موجودی بردهای ESP در پنل",
      status: TicketStatus.ANSWERED,
      createdAt: daysAgo(1),
      messages: {
        create: [
          {
            userId: partner.id,
            body: "موجودی ESP32 در پنل همکار با انبار همخوانی ندارد.",
            isStaff: false,
            createdAt: daysAgo(1),
          },
          {
            userId: admin.id,
            body: "موجودی هم‌اکنون از انبار همگام شد؛ لطفاً صفحه را رفرش کنید.",
            isStaff: true,
            createdAt: daysAgo(0),
          },
        ],
      },
    },
  });

  const hw = createdProducts.filter((p) => p.type === "HARDWARE").length;
  const dig = createdProducts.filter((p) => p.type === "DIGITAL").length;
  console.log("Seed OK — curated parts catalog loaded");
  console.log({
    accounts: {
      admin: "admin@facksten.com",
      partner: "partner@facksten.com",
      customer: "user@facksten.com",
      password: "Pass123!",
    },
    counts: {
      categories: categoryBySlug.size,
      hardware: hw,
      digital: dig,
      totalProducts: createdProducts.length,
      articles: 6,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
