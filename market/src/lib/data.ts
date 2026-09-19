import { ARTICLE_IMAGES, PRODUCT_IMAGES } from "@/lib/media";

export type ProductType = "hardware" | "digital";

export type ProductIcon =
  | "integration_instructions"
  | "home_iot_device"
  | "schema"
  | "folder_zip";

export type Product = {
  id: string;
  slug: string;
  title: string;
  price: number;
  type: ProductType;
  inStock: boolean;
  image: string;
  brand?: string;
  badge?: string;
  fileLabel?: string;
  fileSize?: string;
  icon?: ProductIcon;
  description?: string;
};

export type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  image: string;
};

export const hardwareProducts: Product[] = [
  {
    id: "1",
    slug: "arduino-uno-r3",
    title: "برد توسعه آردوینو Uno R3 اورجینال",
    price: 850000,
    type: "hardware",
    inStock: true,
    brand: "Arduino",
    image: PRODUCT_IMAGES["arduino-uno-r3"],
    description:
      "برد توسعه آردوینو Uno R3 با تراشه ATmega328P اصلی؛ مناسب آموزش و پروژه‌های الکترونیک.",
  },
  {
    id: "2",
    slug: "raspberry-pi-4-8gb",
    title: "رسپبری پای 4 مدل B ظرفیت 8 گیگابایت",
    price: 4200000,
    type: "hardware",
    inStock: false,
    brand: "Raspberry Pi",
    image: PRODUCT_IMAGES["raspberry-pi-4-8gb"],
  },
  {
    id: "3",
    slug: "esp32-wroom",
    title: "ماژول وای‌فای و بلوتوث ESP32",
    price: 240000,
    type: "hardware",
    inStock: true,
    brand: "Espressif",
    image: PRODUCT_IMAGES["esp32-wroom"],
  },
  {
    id: "4",
    slug: "hc-sr04",
    title: "ماژول سنسور فاصله سنج التراسونیک HC-SR04",
    price: 45000,
    type: "hardware",
    inStock: true,
    brand: "Generic",
    image: PRODUCT_IMAGES["hc-sr04"],
  },
];

export const digitalProducts: Product[] = [
  {
    id: "d1",
    slug: "esp32-controller-source",
    title: "کد منبع کنترلر ESP32",
    price: 120000,
    type: "digital",
    inStock: true,
    fileLabel: "C++ / INO",
    fileSize: "۱.۸ مگابایت",
    icon: "integration_instructions",
    image: PRODUCT_IMAGES["esp32-controller-source"],
  },
  {
    id: "d2",
    slug: "arduino-smart-home",
    title: "پروژه خانه هوشمند آردوینو",
    price: 250000,
    type: "digital",
    inStock: true,
    fileLabel: "ZIP",
    fileSize: "۴.۲ مگابایت",
    icon: "home_iot_device",
    badge: "جدید",
    image: PRODUCT_IMAGES["arduino-smart-home"],
  },
  {
    id: "d3",
    slug: "pcb-line-follower",
    title: "طراحی PCB ربات مسیریاب",
    price: 85000,
    type: "digital",
    inStock: true,
    fileLabel: "Altium",
    fileSize: "۸.۵ مگابایت",
    icon: "schema",
    image: PRODUCT_IMAGES["pcb-line-follower"],
  },
];

export const articles: Article[] = [
  {
    id: "a1",
    slug: "iot-arduino-guide",
    title: "آموزش جامع اینترنت اشیا (IoT) با بردهای آردوینو",
    excerpt:
      "در این مقاله به بررسی مفاهیم پایه اینترنت اشیا می‌پردازیم و نحوه اتصال سنسورهای مختلف را به پلتفرم‌های ابری آموزش می‌دهیم.",
    category: "اینترنت اشیا",
    date: "۲۴ مهر ۱۴۰۲",
    image: ARTICLE_IMAGES["iot-arduino-guide"],
  },
  {
    id: "a2",
    slug: "arduino-boards-comparison",
    title: "بررسی و مقایسه بردهای آردوینو جدید در بازار",
    excerpt:
      "کدام برد آردوینو برای پروژه شما مناسب‌تر است؟ در این مطلب به مقایسه مدل‌های Uno R4، Nano 33 و Mega می‌پردازیم.",
    category: "بررسی تخصصی",
    date: "۱۸ مهر ۱۴۰۲",
    image: ARTICLE_IMAGES["arduino-boards-comparison"],
  },
  {
    id: "a3",
    slug: "smd-soldering-guide",
    title: "راهنمای جامع لحیم کاری قطعات SMD",
    excerpt:
      "تکنیک‌ها و ابزارهای مورد نیاز برای لحیم کاری حرفه‌ای قطعات نصب سطحی (SMD) را در این مقاله قدم به قدم بیاموزید.",
    category: "آموزش کاربردی",
    date: "۱۰ مهر ۱۴۰۲",
    image: ARTICLE_IMAGES["smd-soldering-guide"],
  },
];

export const allProducts: Product[] = [...hardwareProducts, ...digitalProducts];

export function getProductBySlug(slug: string): Product | undefined {
  return allProducts.find((p) => p.slug === slug);
}

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function searchProducts(q: string, type?: string): Product[] {
  let list = allProducts;
  if (type === "hardware" || type === "digital") {
    list = list.filter((p) => p.type === type);
  }
  const query = q.trim().toLowerCase();
  if (!query) return list;
  return list.filter(
    (p) =>
      p.title.toLowerCase().includes(query) ||
      p.brand?.toLowerCase().includes(query) ||
      p.slug.includes(query),
  );
}
