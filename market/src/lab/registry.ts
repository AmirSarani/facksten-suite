import type { ComponentDef, PinDef } from "./types";
import { withBasePath } from "./base-path";

const MIT = "MIT (Adafruit CAD Parts / PushRSP Lab)";
const ADAFRUIT = "https://github.com/adafruit/Adafruit_CAD_Parts";

// 3D preview models converted from real CAD by scripts/lab-models/build.mjs.
// See src/lab/licenses/ for full license text and public/lab/models/CREDITS.md for per-part credit.
const CC_BY_3 = "CC-BY-3.0 (FreeCAD-library)";
const FREECAD_LIB = "https://github.com/FreeCAD/FreeCAD-library";
const CC_BY_SA_4 = "CC-BY-SA-4.0 (KiCad libraries)";
const KICAD_3D = "https://gitlab.com/kicad/libraries/kicad-packages3D";
const modelPath = (id: string) => withBasePath(`/lab/models/${id}.glb`);

/** 0.1" (2.54 mm) in canvas units — every pin sits on a multiple of this. */
export const PITCH = 10;

const PWM_PINS = new Set([3, 5, 6, 9, 10, 11]);

function digitalPin(i: number, x: number, y: number, label = `D${i}`): PinDef {
  return {
    id: `d${i}`,
    label,
    x,
    y,
    direction: "bidirectional",
    signal: i === 0 ? "uart-rx" : i === 1 ? "uart-tx" : PWM_PINS.has(i) ? "pwm" : "digital",
    arduinoPin: i,
  };
}

/**
 * Uno R3 seen from above, USB on the left (68.6 × 53.3 mm ≈ 280 × 220 units).
 * Top: SCL SDA AREF GND D13…D8 | D7…D0. Bottom: IOREF RESET 3.3V 5V GND GND VIN | A0…A5.
 */
function unoPins(): PinDef[] {
  const top = 10;
  const bottom = 210;
  const pins: PinDef[] = [
    { id: "scl", label: "SCL", x: 90, y: top, direction: "bidirectional", signal: "i2c-scl", arduinoPin: 19 },
    { id: "sda", label: "SDA", x: 100, y: top, direction: "bidirectional", signal: "i2c-sda", arduinoPin: 18 },
    { id: "aref", label: "AREF", x: 110, y: top, direction: "input", signal: "analog" },
    { id: "gnd3", label: "GND", x: 120, y: top, direction: "gnd", signal: "gnd" },
  ];
  for (let i = 13; i >= 8; i--) {
    pins.push({ ...digitalPin(i, 130 + (13 - i) * PITCH, top, i === 13 ? "D13/LED" : undefined), description: i === 13 ? "LED داخلی + پایه دیجیتال ۱۳" : undefined });
  }
  for (let i = 7; i >= 0; i--) pins.push(digitalPin(i, 200 + (7 - i) * PITCH, top));
  pins.push(
    { id: "ioref", label: "IOREF", x: 100, y: bottom, direction: "power", signal: "vcc", voltage: 5 },
    { id: "reset", label: "RESET", x: 110, y: bottom, direction: "input", signal: "reset" },
    { id: "3v3", label: "3.3V", x: 120, y: bottom, direction: "power", signal: "vcc", voltage: 3.3 },
    { id: "5v", label: "5V", x: 130, y: bottom, direction: "power", signal: "vcc", voltage: 5 },
    { id: "gnd1", label: "GND", x: 140, y: bottom, direction: "gnd", signal: "gnd" },
    { id: "gnd2", label: "GND", x: 150, y: bottom, direction: "gnd", signal: "gnd" },
    { id: "vin", label: "VIN", x: 160, y: bottom, direction: "power", signal: "vcc", voltage: 9 },
  );
  const analog = ["a0", "a1", "a2", "a3", "a4", "a5"];
  analog.forEach((id, i) =>
    pins.push({
      id,
      label: id === "a4" ? "A4/SDA" : id === "a5" ? "A5/SCL" : id.toUpperCase(),
      x: 200 + i * PITCH,
      y: bottom,
      direction: i >= 4 ? "bidirectional" : "input",
      signal: id === "a4" ? "i2c-sda" : id === "a5" ? "i2c-scl" : "analog",
      arduinoPin: 14 + i,
    }),
  );
  return pins;
}

/** Nano (45 × 18 mm): two 15-pin rows 0.6" apart, USB on the left. */
function nanoPins(): PinDef[] {
  const x = (i: number) => 20 + i * PITCH;
  const top: PinDef[] = [
    digitalPin(13, x(0), 10),
    { id: "3v3", label: "3V3", x: x(1), y: 10, direction: "power", signal: "vcc", voltage: 3.3 },
    { id: "aref", label: "AREF", x: x(2), y: 10, direction: "input", signal: "analog" },
  ];
  for (let i = 0; i < 8; i++) {
    top.push({
      id: `a${i}`,
      label: `A${i}`,
      x: x(3 + i),
      y: 10,
      direction: i === 4 || i === 5 ? "bidirectional" : "input",
      signal: i === 4 ? "i2c-sda" : i === 5 ? "i2c-scl" : "analog",
      arduinoPin: 14 + i,
    });
  }
  top.push(
    { id: "5v", label: "5V", x: x(11), y: 10, direction: "power", signal: "vcc", voltage: 5 },
    { id: "rst", label: "RST", x: x(12), y: 10, direction: "input", signal: "reset" },
    { id: "gnd", label: "GND", x: x(13), y: 10, direction: "gnd", signal: "gnd" },
    { id: "vin", label: "VIN", x: x(14), y: 10, direction: "power", signal: "vcc", voltage: 9 },
  );
  const bottom: PinDef[] = [];
  for (let i = 12; i >= 2; i--) bottom.push(digitalPin(i, x(12 - i), 70));
  bottom.push(
    { id: "gnd2", label: "GND", x: x(11), y: 70, direction: "gnd", signal: "gnd" },
    { id: "rst2", label: "RST", x: x(12), y: 70, direction: "input", signal: "reset" },
    digitalPin(0, x(13), 70, "RX0"),
    digitalPin(1, x(14), 70, "TX1"),
  );
  return [...top, ...bottom];
}

/** Full-size 830-point breadboard: 63 columns × rows a–j + four 50-hole power rails. */
export const BB = {
  cols: 63,
  colX: (c: number) => 30 + (c - 1) * PITCH,
  rowY: { a: 60, b: 70, c: 80, d: 90, e: 100, f: 130, g: 140, h: 150, i: 160, j: 170 } as Record<string, number>,
  rails: { tp: 20, tn: 30, bp: 200, bn: 210 } as Record<string, number>,
  /** Rail holes come in 10 groups of 5 with a one-hole gap. */
  railCol: (n: number) => 3 + Math.floor((n - 1) / 5) * 6 + ((n - 1) % 5),
  width: 680,
  height: 240,
};

function breadboardPins(): { pins: PinDef[]; nets: string[][] } {
  const pins: PinDef[] = [];
  const nets: string[][] = [];
  const hole = (id: string, label: string, x: number, y: number): PinDef => ({
    id, label, x, y, direction: "bidirectional", signal: "passive",
  });
  for (let c = 1; c <= BB.cols; c++) {
    for (const half of ["abcde", "fghij"]) {
      const ids = [...half].map((r) => `${r}${c}`);
      for (const r of half) pins.push(hole(`${r}${c}`, `${r}${c}`, BB.colX(c), BB.rowY[r]));
      nets.push(ids);
    }
  }
  const railName: Record<string, string> = { tp: "+", tn: "−", bp: "+", bn: "−" };
  for (const [rail, y] of Object.entries(BB.rails)) {
    const ids: string[] = [];
    for (let n = 1; n <= 50; n++) {
      ids.push(`${rail}${n}`);
      pins.push(hole(`${rail}${n}`, `${railName[rail]} ${rail.startsWith("t") ? "بالا" : "پایین"}`, BB.colX(BB.railCol(n)), y));
    }
    nets.push(ids);
  }
  return { pins, nets };
}

const BREADBOARD = breadboardPins();

/** Static seed catalog — productId/price/stock filled by product-adapter */
export const LAB_COMPONENTS_SEED: ComponentDef[] = [
  {
    id: "arduino-uno",
    name: "Arduino Uno R3",
    slug: "arduino-uno",
    productId: null,
    catalogSlug: "arduino-uno-r3",
    category: "board",
    description: "برد آردوینو Uno با ATmega328P — شبیه‌سازی کامل Blink با avr8js",
    thumbnail: "/lab/thumbs/arduino-uno.svg",
    modelUrl: modelPath("arduino-uno"),
    sourceUrl: `${FREECAD_LIB}/tree/master/Electronics%20Parts/Boards/Arduino/Arduino%20UNO`,
    license: CC_BY_3,
    simulationStatus: "simulated",
    protocols: ["gpio", "i2c", "spi", "uart", "pwm", "analog"],
    pins: unoPins(),
    internalNets: [["gnd1", "gnd2", "gnd3"], ["a4", "sda"], ["a5", "scl"]],
    voltageRange: { min: 5, max: 5 },
    currentLimit: 40,
    properties: { mcu: "ATmega328P", clock: "16MHz" },
    behaviorModel: { kind: "mcu", mcu: "atmega328p", clockHz: 16_000_000 },
    compatibleBoards: ["arduino-uno"],
    stockStatus: "unknown",
    price: null,
    width: 280,
    height: 220,
  },
  {
    id: "arduino-nano",
    name: "Arduino Nano",
    slug: "arduino-nano",
    productId: null,
    catalogSlug: "arduino-nano",
    category: "board",
    description: "برد فشرده Nano — همان هسته ATmega328P؛ مستقیم روی بردبورد می‌نشیند",
    thumbnail: "/lab/thumbs/arduino-nano.svg",
    modelUrl: modelPath("arduino-nano"),
    sourceUrl: `${FREECAD_LIB}/blob/master/Electronics%20Parts/Boards/Arduino/Nano-Rev3_0.fcstd`,
    license: CC_BY_3,
    simulationStatus: "simulated",
    protocols: ["gpio", "i2c", "spi", "uart", "pwm", "analog"],
    pins: nanoPins(),
    internalNets: [["gnd", "gnd2"], ["rst", "rst2"]],
    voltageRange: { min: 5, max: 5 },
    currentLimit: 40,
    properties: { mcu: "ATmega328P", clock: "16MHz" },
    behaviorModel: { kind: "mcu", mcu: "atmega328p", clockHz: 16_000_000 },
    compatibleBoards: ["arduino-nano", "arduino-uno"],
    stockStatus: "unknown",
    price: null,
    width: 180,
    height: 80,
  },
  {
    id: "breadboard",
    name: "بردبورد ۸۳۰ نقطه",
    slug: "breadboard",
    productId: null,
    catalogSlug: "breadboard-830",
    category: "passive",
    description: "بردبورد کامل ۸۳۰ نقطه: ۶۳ ستون (هر ستون دو گروه ۵تایی a–e و f–j) و چهار ریل تغذیه. پایه‌ی قطعات را داخل سوراخ‌ها بگذارید تا خودکار وصل شوند.",
    thumbnail: "/lab/thumbs/breadboard.svg",
    modelUrl: null,
    sourceUrl: ADAFRUIT,
    license: MIT,
    simulationStatus: "wireable",
    protocols: ["power"],
    pins: BREADBOARD.pins,
    internalNets: BREADBOARD.nets,
    voltageRange: { min: 0, max: 5 },
    currentLimit: null,
    properties: { points: 830 },
    behaviorModel: { kind: "breadboard", rows: 10, cols: BB.cols },
    compatibleBoards: ["arduino-uno", "arduino-nano"],
    stockStatus: "unknown",
    price: null,
    width: BB.width,
    height: BB.height,
  },
  {
    id: "led-red",
    name: "LED قرمز ۵mm",
    slug: "led-red",
    productId: null,
    catalogSlug: "led-5mm-red-pack",
    category: "led",
    description: "ال‌ای‌دی قرمز — پایه‌ی بلندتر آند (+) است؛ با مقاومت سری به خروجی دیجیتال وصل کنید",
    thumbnail: "/lab/thumbs/led-red.svg",
    modelUrl: modelPath("led-red"),
    sourceUrl: `${KICAD_3D}/-/blob/master/LED_THT.3dshapes/LED_D5.0mm.step`,
    license: CC_BY_SA_4,
    simulationStatus: "simulated",
    protocols: ["gpio"],
    pins: [
      { id: "cathode", label: "کاتد (−)", x: 10, y: 20, direction: "gnd", signal: "gnd" },
      { id: "anode", label: "آند (+)", x: 20, y: 20, direction: "input", signal: "digital" },
    ],
    voltageRange: { min: 1.8, max: 2.2 },
    currentLimit: 20,
    properties: { color: "red", diameterMm: 5 },
    behaviorModel: { kind: "led", color: "#ef4444", forwardVoltage: 2.0 },
    compatibleBoards: ["arduino-uno", "arduino-nano"],
    stockStatus: "unknown",
    price: null,
    width: 30,
    height: 30,
  },
  {
    id: "led-rgb",
    name: "LED RGB کاتد مشترک",
    slug: "led-rgb",
    productId: null,
    catalogSlug: "led-5mm-rgb",
    category: "led",
    description: "ال‌ای‌دی RGB — در MVP قابل سیم‌کشی؛ شبیه‌سازی رنگی کامل به‌زودی",
    thumbnail: "/lab/thumbs/led-rgb.svg",
    modelUrl: modelPath("led-rgb"),
    sourceUrl: `${KICAD_3D}/-/blob/master/LED_THT.3dshapes/LED_D5.0mm-4_RGB.step`,
    license: CC_BY_SA_4,
    simulationStatus: "wireable",
    protocols: ["gpio", "pwm"],
    pins: [
      { id: "r", label: "R", x: 10, y: 40, direction: "input", signal: "pwm" },
      { id: "gnd", label: "GND", x: 20, y: 40, direction: "gnd", signal: "gnd" },
      { id: "g", label: "G", x: 30, y: 40, direction: "input", signal: "pwm" },
      { id: "b", label: "B", x: 40, y: 40, direction: "input", signal: "pwm" },
    ],
    voltageRange: { min: 1.8, max: 3.3 },
    currentLimit: 20,
    properties: { common: "cathode" },
    behaviorModel: { kind: "led", color: "#ffffff", forwardVoltage: 2.2 },
    compatibleBoards: ["arduino-uno", "arduino-nano"],
    stockStatus: "unknown",
    price: null,
    width: 50,
    height: 50,
  },
  {
    id: "resistor-220",
    name: "مقاومت ۲۲۰ اهم",
    slug: "resistor-220",
    productId: null,
    catalogSlug: "resistor-220r",
    category: "passive",
    description: "مقاومت سری استاندارد برای LED روی ۵V — فاصله‌ی پایه‌ها ۴ سوراخ",
    thumbnail: "/lab/thumbs/resistor.svg",
    modelUrl: null,
    sourceUrl: ADAFRUIT,
    license: MIT,
    simulationStatus: "wireable",
    protocols: ["power"],
    pins: [
      { id: "a", label: "A", x: 10, y: 10, direction: "bidirectional", signal: "digital" },
      { id: "b", label: "B", x: 50, y: 10, direction: "bidirectional", signal: "digital" },
    ],
    voltageRange: { min: 0, max: 5 },
    currentLimit: null,
    properties: { ohms: 220, tolerance: "5%" },
    behaviorModel: { kind: "resistor", ohms: 220 },
    compatibleBoards: ["arduino-uno", "arduino-nano"],
    stockStatus: "unknown",
    price: null,
    width: 60,
    height: 20,
  },
  {
    id: "resistor-10k",
    name: "مقاومت ۱۰کیلواهم",
    slug: "resistor-10k",
    productId: null,
    catalogSlug: "resistor-10k",
    category: "passive",
    description: "مقاومت پول‌آپ/پول‌داون رایج برای دکمه — فاصله‌ی پایه‌ها ۴ سوراخ",
    thumbnail: "/lab/thumbs/resistor.svg",
    modelUrl: null,
    sourceUrl: ADAFRUIT,
    license: MIT,
    simulationStatus: "wireable",
    protocols: ["power"],
    pins: [
      { id: "a", label: "A", x: 10, y: 10, direction: "bidirectional", signal: "digital" },
      { id: "b", label: "B", x: 50, y: 10, direction: "bidirectional", signal: "digital" },
    ],
    voltageRange: { min: 0, max: 5 },
    currentLimit: null,
    properties: { ohms: 10000 },
    behaviorModel: { kind: "resistor", ohms: 10000 },
    compatibleBoards: ["arduino-uno", "arduino-nano"],
    stockStatus: "unknown",
    price: null,
    width: 60,
    height: 20,
  },
  {
    id: "button",
    name: "پوش‌باتن لحظه‌ای",
    slug: "button",
    productId: null,
    catalogSlug: null,
    category: "input",
    description: "کلید فشاری ۶mm — روی شیار وسط بردبورد بگذارید. پایه‌های رو‌به‌روی هم (۱–۳ و ۲–۴) همیشه به هم وصل‌اند؛ فشار، دو طرف را به هم وصل می‌کند.",
    thumbnail: "/lab/thumbs/button.svg",
    modelUrl: modelPath("button"),
    sourceUrl: `${KICAD_3D}/-/blob/master/Button_Switch_THT.3dshapes/SW_PUSH_6mm.step`,
    license: CC_BY_SA_4,
    simulationStatus: "simulated",
    protocols: ["gpio"],
    pins: [
      { id: "a1", label: "1", x: 10, y: 10, direction: "bidirectional", signal: "digital" },
      { id: "a2", label: "2", x: 40, y: 10, direction: "bidirectional", signal: "digital" },
      { id: "b1", label: "3", x: 10, y: 40, direction: "bidirectional", signal: "digital" },
      { id: "b2", label: "4", x: 40, y: 40, direction: "bidirectional", signal: "digital" },
    ],
    internalNets: [["a1", "b1"], ["a2", "b2"]],
    voltageRange: { min: 0, max: 5 },
    currentLimit: null,
    properties: { type: "NO" },
    behaviorModel: { kind: "button", normallyOpen: true },
    compatibleBoards: ["arduino-uno", "arduino-nano"],
    stockStatus: "unknown",
    price: null,
    width: 50,
    height: 50,
  },
  {
    id: "potentiometer",
    name: "پتانسیومتر ۱۰ک",
    slug: "potentiometer",
    productId: null,
    catalogSlug: null,
    category: "input",
    description: "ولوم آنالوگ — قابل سیم‌کشی به A0؛ شبیه‌سازی مقدار در فاز بعد",
    thumbnail: "/lab/thumbs/pot.svg",
    modelUrl: modelPath("potentiometer"),
    sourceUrl: `${ADAFRUIT}/tree/main/562%2010K%20Potentiometer`,
    license: MIT,
    simulationStatus: "wireable",
    protocols: ["analog", "power"],
    pins: [
      { id: "vcc", label: "VCC", x: 10, y: 50, direction: "power", signal: "vcc", voltage: 5 },
      { id: "wiper", label: "SIG", x: 20, y: 50, direction: "output", signal: "analog" },
      { id: "gnd", label: "GND", x: 30, y: 50, direction: "gnd", signal: "gnd" },
    ],
    voltageRange: { min: 0, max: 5 },
    currentLimit: null,
    properties: { maxOhms: 10000 },
    behaviorModel: { kind: "potentiometer", maxOhms: 10000 },
    compatibleBoards: ["arduino-uno", "arduino-nano"],
    stockStatus: "unknown",
    price: null,
    width: 40,
    height: 60,
  },
  {
    id: "buzzer",
    name: "بازر پسیو",
    slug: "buzzer",
    productId: null,
    catalogSlug: null,
    category: "actuator",
    description: "بازر پسیو ۱۲mm — قابل سیم‌کشی؛ تولید صدا در شبیه‌سازی به‌زودی",
    thumbnail: "/lab/thumbs/buzzer.svg",
    modelUrl: modelPath("buzzer"),
    sourceUrl: `${KICAD_3D}/-/blob/master/Buzzer_Beeper.3dshapes/Buzzer_12x9.5RM7.6.step`,
    license: CC_BY_SA_4,
    simulationStatus: "wireable",
    protocols: ["gpio", "pwm"],
    pins: [
      { id: "sig", label: "+", x: 10, y: 40, direction: "input", signal: "pwm" },
      { id: "gnd", label: "−", x: 40, y: 40, direction: "gnd", signal: "gnd" },
    ],
    voltageRange: { min: 3, max: 5 },
    currentLimit: 30,
    properties: { passive: true },
    behaviorModel: { kind: "buzzer", passive: true },
    compatibleBoards: ["arduino-uno", "arduino-nano"],
    stockStatus: "unknown",
    price: null,
    width: 50,
    height: 50,
  },
  {
    id: "servo-sg90",
    name: "سروو SG90",
    slug: "servo-sg90",
    productId: null,
    catalogSlug: "servo-sg90",
    category: "actuator",
    description: "سروموتور میکرو — کانکتور ۳ پین: قهوه‌ای GND، قرمز VCC، نارنجی سیگنال",
    thumbnail: "/lab/thumbs/servo.svg",
    modelUrl: modelPath("servo-sg90"),
    sourceUrl: `${FREECAD_LIB}/tree/master/Electrical%20Parts/Servos/SG-90`,
    license: CC_BY_3,
    simulationStatus: "simulated",
    protocols: ["pwm", "power"],
    pins: [
      { id: "gnd", label: "GND", x: 30, y: 50, direction: "gnd", signal: "gnd" },
      { id: "vcc", label: "VCC", x: 40, y: 50, direction: "power", signal: "vcc", voltage: 5 },
      { id: "sig", label: "SIG", x: 50, y: 50, direction: "input", signal: "pwm" },
    ],
    voltageRange: { min: 4.8, max: 6 },
    currentLimit: 500,
    properties: { model: "SG90" },
    behaviorModel: { kind: "servo", minUs: 500, maxUs: 2500 },
    compatibleBoards: ["arduino-uno", "arduino-nano"],
    stockStatus: "unknown",
    price: null,
    width: 80,
    height: 60,
  },
  {
    id: "dht22",
    name: "DHT22 دما/رطوبت",
    slug: "dht22",
    productId: null,
    catalogSlug: "dht22",
    category: "sensor",
    description: "سنسور DHT22 — سیم‌کشی و قالب سریال؛ داده حسگر شبیه‌سازی‌شده ثابت برچسب‌خورده",
    thumbnail: "/lab/thumbs/dht22.svg",
    modelUrl: null,
    sourceUrl: ADAFRUIT,
    license: MIT,
    simulationStatus: "wireable",
    protocols: ["onewire", "power"],
    pins: [
      { id: "vcc", label: "VCC", x: 10, y: 60, direction: "power", signal: "vcc", voltage: 5 },
      { id: "data", label: "DATA", x: 20, y: 60, direction: "bidirectional", signal: "digital" },
      { id: "nc", label: "NC", x: 30, y: 60, direction: "nc", signal: "nc" },
      { id: "gnd", label: "GND", x: 40, y: 60, direction: "gnd", signal: "gnd" },
    ],
    voltageRange: { min: 3.3, max: 5.5 },
    currentLimit: 2.5,
    properties: {},
    behaviorModel: { kind: "dht22" },
    compatibleBoards: ["arduino-uno", "arduino-nano"],
    stockStatus: "unknown",
    price: null,
    width: 50,
    height: 70,
  },
  {
    id: "hc-sr04",
    name: "HC-SR04 التراسونیک",
    slug: "hc-sr04",
    productId: null,
    catalogSlug: "hc-sr04",
    category: "sensor",
    description: "سنسور فاصله — قالب آماده با Trig/Echo؛ شبیه‌سازی فاصله ثابت برچسب‌خورده در سریال",
    thumbnail: "/lab/thumbs/hcsr04.svg",
    modelUrl: modelPath("hc-sr04"),
    sourceUrl: `${FREECAD_LIB}/tree/master/Electronics%20Parts/Ultrasonic%20Sensors`,
    license: CC_BY_3,
    simulationStatus: "wireable",
    protocols: ["gpio", "power"],
    pins: [
      { id: "vcc", label: "VCC", x: 30, y: 40, direction: "power", signal: "vcc", voltage: 5 },
      { id: "trig", label: "TRIG", x: 40, y: 40, direction: "input", signal: "digital" },
      { id: "echo", label: "ECHO", x: 50, y: 40, direction: "output", signal: "digital" },
      { id: "gnd", label: "GND", x: 60, y: 40, direction: "gnd", signal: "gnd" },
    ],
    voltageRange: { min: 5, max: 5 },
    currentLimit: 15,
    properties: {},
    behaviorModel: { kind: "hcsr04" },
    compatibleBoards: ["arduino-uno", "arduino-nano"],
    stockStatus: "unknown",
    price: null,
    width: 90,
    height: 50,
  },
  {
    id: "pir",
    name: "PIR HC-SR501",
    slug: "pir",
    productId: null,
    catalogSlug: "pir-hc-sr501",
    category: "sensor",
    description: "سنسور حرکت PIR — قابل سیم‌کشی؛ رویداد حرکت تعاملی به‌زودی",
    thumbnail: "/lab/thumbs/pir.svg",
    modelUrl: null,
    sourceUrl: ADAFRUIT,
    license: MIT,
    simulationStatus: "3d-only",
    protocols: ["gpio", "power"],
    pins: [
      { id: "vcc", label: "VCC", x: 20, y: 50, direction: "power", signal: "vcc", voltage: 5 },
      { id: "out", label: "OUT", x: 30, y: 50, direction: "output", signal: "digital" },
      { id: "gnd", label: "GND", x: 40, y: 50, direction: "gnd", signal: "gnd" },
    ],
    voltageRange: { min: 4.5, max: 20 },
    currentLimit: null,
    properties: {},
    behaviorModel: { kind: "pir" },
    compatibleBoards: ["arduino-uno", "arduino-nano"],
    stockStatus: "unknown",
    price: null,
    width: 60,
    height: 60,
  },
  {
    id: "lcd-1602",
    name: "LCD 1602",
    slug: "lcd-1602",
    productId: null,
    catalogSlug: "lcd-1602",
    category: "display",
    description: "نمایشگر کاراکتری ۲×۱۶ با ماژول I2C — مدل سه‌بعدی/سیم‌کشی؛ شبیه‌سازی متن به‌زودی",
    thumbnail: "/lab/thumbs/lcd1602.svg",
    modelUrl: modelPath("lcd-1602"),
    sourceUrl: `${KICAD_3D}/-/blob/master/Display.3dshapes/WC1602A.step`,
    license: CC_BY_SA_4,
    simulationStatus: "3d-only",
    protocols: ["gpio", "i2c", "power"],
    pins: [
      { id: "vss", label: "GND", x: 20, y: 70, direction: "gnd", signal: "gnd" },
      { id: "vdd", label: "VCC", x: 30, y: 70, direction: "power", signal: "vcc", voltage: 5 },
      { id: "sda", label: "SDA", x: 40, y: 70, direction: "bidirectional", signal: "i2c-sda" },
      { id: "scl", label: "SCL", x: 50, y: 70, direction: "bidirectional", signal: "i2c-scl" },
    ],
    voltageRange: { min: 5, max: 5 },
    currentLimit: null,
    properties: { cols: 16, rows: 2 },
    behaviorModel: { kind: "lcd1602", cols: 16, rows: 2 },
    compatibleBoards: ["arduino-uno", "arduino-nano"],
    stockStatus: "unknown",
    price: null,
    width: 160,
    height: 80,
  },
  {
    id: "oled-128x64",
    name: "OLED 128×64 I2C",
    slug: "oled-128x64",
    productId: null,
    catalogSlug: "oled-128x64",
    category: "display",
    description: "نمایشگر OLED — فقط مدل/کاتالوگ در MVP (۳d-only)",
    thumbnail: "/lab/thumbs/oled.svg",
    modelUrl: modelPath("oled-128x64"),
    sourceUrl: `${KICAD_3D}/-/blob/master/Display.3dshapes/Adafruit_SSD1306.step`,
    license: CC_BY_SA_4,
    simulationStatus: "3d-only",
    protocols: ["i2c", "power"],
    pins: [
      { id: "gnd", label: "GND", x: 30, y: 10, direction: "gnd", signal: "gnd" },
      { id: "vcc", label: "VCC", x: 40, y: 10, direction: "power", signal: "vcc", voltage: 3.3 },
      { id: "scl", label: "SCL", x: 50, y: 10, direction: "bidirectional", signal: "i2c-scl" },
      { id: "sda", label: "SDA", x: 60, y: 10, direction: "bidirectional", signal: "i2c-sda" },
    ],
    voltageRange: { min: 3.3, max: 5 },
    currentLimit: null,
    properties: { width: 128, height: 64 },
    behaviorModel: { kind: "oled", width: 128, height: 64, bus: "i2c" },
    compatibleBoards: ["arduino-uno", "arduino-nano"],
    stockStatus: "unknown",
    price: null,
    width: 90,
    height: 70,
  },
];

export function getComponentById(id: string): ComponentDef | undefined {
  return LAB_COMPONENTS_SEED.find((c) => c.id === id);
}

export function getComponentBySlug(slug: string): ComponentDef | undefined {
  return LAB_COMPONENTS_SEED.find((c) => c.slug === slug || c.catalogSlug === slug);
}

export function listComponents(): ComponentDef[] {
  return LAB_COMPONENTS_SEED;
}

/** Parts whose holes other parts plug into (breadboards, sockets). */
export function isSocket(def: ComponentDef): boolean {
  return def.pins.some((p) => p.signal === "passive");
}

export const SIM_STATUS_LABEL: Record<string, string> = {
  simulated: "قابل شبیه‌سازی",
  wireable: "فقط سیم‌کشی",
  "3d-only": "فقط مدل سه‌بعدی",
};
