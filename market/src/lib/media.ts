/** Local media paths extracted from Desktop\\a mockups */

/** Explicit per-slug product images (preferred when present). */
export const PRODUCT_IMAGES: Record<string, string> = {
  "arduino-uno-r3": "/images/products/shop-dev-board.jpg",
  "arduino-uno-ch340": "/images/products/arduino-uno-lifestyle.jpg",
  "arduino-nano": "/images/products/arduino-nano.jpg",
  "arduino-mega-2560": "/images/products/shop-dev-board.jpg",
  "arduino-pro-mini": "/images/products/arduino-nano.jpg",
  "arduino-leonardo": "/images/products/arduino-uno-r3.jpg",
  "raspberry-pi-4-8gb": "/images/products/shop-pi.jpg",
  "esp32-wroom": "/images/products/shop-esp32.jpg",
  "hc-sr04": "/images/products/hc-sr04.jpg",
  "stm32-bluepill": "/images/products/stm32-bluepill.jpg",
  "oled-128x64": "/images/products/shop-sensor.jpg",
  dht22: "/images/products/shop-sensor.jpg",
  "l298n-driver": "/images/products/dev-board-dark.jpg",
  mpu6050: "/images/products/sensor-module.jpg",
  "logic-analyzer-8ch": "/images/products/esp32-wroom-b.jpg",
  "breadboard-830": "/images/products/breadboard.jpg",
  "esp32-controller-source": "/images/products/esp32-wroom-c.jpg",
  "arduino-smart-home": "/images/products/arduino-uno-lifestyle.jpg",
  "pcb-line-follower": "/images/products/dev-board-dark.jpg",
  "pid-motor-lab": "/images/products/led-circuit.jpg",
  "fpga-vga-starter": "/images/products/stm32-bluepill.jpg",
  "iot-dashboard-ui": "/images/products/laptop-desk.jpg",
  "sensor-kit-37": "/images/products/sensor-module.jpg",
  "wemos-d1-mini": "/images/products/shop-esp32.jpg",
  "cap-cer-100nf-50v": "/images/products/breadboard.jpg",
};

/** Category defaults — keep passives off the CPU macro chip. */
export const CATEGORY_IMAGES: Record<string, string> = {
  resistors: "/images/products/led-circuit.jpg",
  capacitors: "/images/products/breadboard.jpg",
  diodes: "/images/products/sensor-module.jpg",
  transistors: "/images/products/stm32-bluepill.jpg",
  "ics-regulators": "/images/products/chip-macro.jpg",
  arduino: "/images/products/shop-dev-board.jpg",
  "esp-stm": "/images/products/shop-esp32.jpg",
  sbc: "/images/products/shop-pi.jpg",
  "sensors-modules": "/images/products/shop-sensor.jpg",
  power: "/images/products/dev-board-dark.jpg",
  connectors: "/images/products/breadboard.jpg",
  tools: "/images/products/breadboard.jpg",
  digital: "/images/products/laptop-desk.jpg",
};

/** Slug-prefix / keyword → image (checked after explicit PRODUCT_IMAGES). */
const SLUG_IMAGE_RULES: { test: RegExp; image: string }[] = [
  { test: /^resistor/, image: "/images/products/led-circuit.jpg" },
  { test: /^cap-/, image: "/images/products/breadboard.jpg" },
  { test: /^diode|^bridge|^led-/, image: "/images/products/sensor-module.jpg" },
  { test: /^tr-irfz|^tr-ao|mosfet/, image: "/images/products/chip-macro.jpg" },
  { test: /^tr-/, image: "/images/products/stm32-bluepill.jpg" },
  { test: /^ic-|^atmega|^crystal/, image: "/images/products/chip-macro.jpg" },
  { test: /^arduino/, image: "/images/products/shop-dev-board.jpg" },
  { test: /^esp|^wemos/, image: "/images/products/shop-esp32.jpg" },
  { test: /^stm/, image: "/images/products/stm32-bluepill.jpg" },
  { test: /^raspberry|^pi-/, image: "/images/products/shop-pi.jpg" },
  { test: /^hc-sr|^ultrasonic/, image: "/images/products/hc-sr04.jpg" },
  { test: /^dht|^mpu|^oled|^ssd1306|^sensor/, image: "/images/products/shop-sensor.jpg" },
  { test: /^servo|^stepper|^l298/, image: "/images/products/dev-board-dark.jpg" },
  { test: /^header|^dupont|^terminal|^usb-|^jumper/, image: "/images/products/breadboard.jpg" },
  { test: /^breadboard|^protoboard/, image: "/images/products/breadboard.jpg" },
  { test: /^solder|^tweezers|^helping|^multimeter|^soldering/, image: "/images/products/led-circuit.jpg" },
  { test: /^logic-analyzer/, image: "/images/products/esp32-wroom-b.jpg" },
  { test: /^battery|^bms|^power|^adapter|^buck|^boost/, image: "/images/products/dev-board-dark.jpg" },
  { test: /^pcb-|^fpga|^iot-dashboard|^pid-/, image: "/images/products/laptop-desk.jpg" },
];

const GENERIC_CHIP = "/images/products/chip-macro.jpg";

export const PRODUCT_GALLERY: Record<string, string[]> = {
  "arduino-uno-r3": [
    "/images/products/arduino-uno-r3.jpg",
    "/images/products/arduino-uno-r3-2.jpg",
    "/images/products/arduino-uno-r3-3.jpg",
    "/images/products/arduino-uno-r3-4.jpg",
    "/images/products/arduino-uno-lifestyle.jpg",
  ],
  "raspberry-pi-4-8gb": [
    "/images/products/raspberry-pi-4.jpg",
    "/images/products/raspberry-pi-4-b.jpg",
    "/images/products/raspberry-pi-4-c.jpg",
  ],
  "esp32-wroom": [
    "/images/products/esp32-wroom.jpg",
    "/images/products/esp32-wroom-b.jpg",
    "/images/products/esp32-wroom-c.jpg",
  ],
};

export const ARTICLE_IMAGES: Record<string, string> = {
  "iot-arduino-guide": "/images/articles/iot-arduino.jpg",
  "arduino-boards-comparison": "/images/articles/arduino-boards.jpg",
  "smd-soldering-guide": "/images/articles/smd-soldering.jpg",
  "esp32-mqtt-tips": "/images/articles/esp32-mqtt.jpg",
  "raspberry-pi-homelab": "/images/articles/pi-homelab.jpg",
  "pcb-design-checklist": "/images/articles/pcb-checklist.jpg",
};

export const UI_IMAGES = {
  homeHero: "/images/ui/home-hero.jpg",
  aboutHero: "/images/ui/about-hero.jpg",
  aboutStory: "/images/ui/about-story.jpg",
  aboutLab: "/images/ui/about-lab.jpg",
  contactMap: "/images/ui/contact-map.jpg",
  author: "/images/ui/author.jpg",
  partnerAvatar: "/images/ui/partner-avatar.jpg",
  partnerManager: "/images/ui/partner-manager.jpg",
  team: [
    "/images/ui/team-1.jpg",
    "/images/ui/team-2.jpg",
    "/images/ui/team-3.jpg",
    "/images/ui/team-4.jpg",
  ] as const,
};

/**
 * Resolve a local product image by slug, then slug rules, then category.
 * Prefer this over a single chip-macro fallback for every SKU.
 */
export function resolveProductImage(opts: {
  slug: string;
  categorySlug?: string | null;
  type?: "HARDWARE" | "DIGITAL" | string | null;
  explicit?: string | null;
}): string {
  const { slug, categorySlug, type, explicit } = opts;

  if (explicit && explicit !== GENERIC_CHIP && explicit !== "/placeholder.svg") {
    return explicit;
  }

  if (PRODUCT_IMAGES[slug]) return PRODUCT_IMAGES[slug];

  for (const rule of SLUG_IMAGE_RULES) {
    if (rule.test.test(slug)) return rule.image;
  }

  if (categorySlug && CATEGORY_IMAGES[categorySlug]) {
    return CATEGORY_IMAGES[categorySlug];
  }

  if (type === "DIGITAL") return "/images/products/laptop-desk.jpg";

  return "/placeholder.svg";
}

export function productImagePath(slug: string, _fallbackLabel = "محصول"): string {
  return resolveProductImage({ slug });
}

export function articleImagePath(slug: string): string {
  return ARTICLE_IMAGES[slug] || "/placeholder.svg";
}

export function galleryFor(slug: string, primary: string): string[] {
  const extra = PRODUCT_GALLERY[slug];
  if (extra?.length) return extra;
  return [primary || "/placeholder.svg", primary || "/placeholder.svg", primary || "/placeholder.svg"];
}
