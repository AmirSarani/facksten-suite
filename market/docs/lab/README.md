# آزمایشگاه مجازی فکستن

## نصب

وابستگی‌ها: `avr8js`, `@monaco-editor/react` (+ monaco). روی سرور برای کامپایل: `gcc-avr`, `binutils-avr`, `avr-libc`.

```bash
cd /opt/facksten/app
npm install
npm run lab:sync   # اختیاری — همگام‌سازی Adafruit CAD
npm run test:lab
npm run build
systemctl restart facksten-market
```

مسیر عمومی: `/facksten/lab` (basePath).

## افزودن قطعه

1. تعریف را در `src/lab/registry.ts` اضافه کنید (`ComponentDef` کامل).
2. در صورت وجود محصول فروشگاه، `catalogSlug` و `CATALOG_SLUG_MAP` را در `product-adapter.ts` تنظیم کنید.
3. اگر رفتار شبیه‌سازی ندارید: `simulationStatus: "wireable"` یا `"3d-only"` — هرگز پین ساختگی نزنید.
4. قالب اختیاری در `src/lab/templates/`.
5. تصویر روی بوم: یک تابع در `src/lab/visuals/part-art.tsx` (در همان جعبه‌ی `width×height`، هم‌راستا با `pins[].x/y`). مدل سه‌بعدی: یک تابع در `src/lab/visuals/models-3d.ts`. بدون این دو، قطعه با شکل پیش‌فرض نمایش داده می‌شود.

## میز کار (`/lab/workspace`)

- تمام‌صفحه؛ هدر و فوتر سایت در `components/site-chrome.tsx` برای این مسیر خاموش است.
- ساختار: `lab-workspace.tsx` (state، تاریخچه‌ی واگرد، موتور) ← `workspace-topbar`، `parts-panel`، `board-canvas`، `bottom-panel` (کد/سریال/گزارش/بررسی/BOM)، `inspector`، `onboarding-tour`.
- هندسه (چرخش، snap، fit، و LEDهایی که واقعاً از D13 تغذیه می‌شوند): `src/lab/geometry.ts` با تست.
- میان‌بُرها: `Ctrl+Enter` اجرا، `Ctrl+Z`/`Ctrl+Shift+Z` واگرد/ازنو، `Del` حذف، `R` چرخش، `Esc` لغو.
- کامپایل نیاز به ورود دارد (`/api/lab/compile`). اگر کامپایل ممکن نباشد و کد شبیه Blink باشد، فرم‌ویر آماده‌ی Blink اجرا و این موضوع صریحاً در گزارش نوشته می‌شود.

## کامپایلر و Worker

- `POST /api/lab/compile` کد Arduino-مانند را با shim در `scripts/lab-shim/` و `avr-gcc -mmcu=atmega328p` به Intel HEX تبدیل می‌کند.
- کلاینت HEX را به `Avr8Engine` می‌دهد؛ Worker (`avr8-worker.ts`) حلقه `avrInstruction` را اجرا و PORTB5 (D13) را گزارش می‌کند.
- کتابخانه‌های سنگین (Wire/LiquidCrystal و …) عمداً رد می‌شوند با پیام فارسی.

## همگام‌سازی Adafruit

`npm run lab:sync` → `/opt/facksten/lab-assets` + `public/lab/catalog-index.json`. فایل‌های STEP خام داخل باندل JS کلاینت نمی‌روند.

## محدودیت‌ها (صادقانه)

- SPICE کامل، اسیلوسکوپ واقعی، Logic Analyzer عمیق: خارج از محدوده MVP.
- Servo/HC-SR04: قالب و سیم‌کشی هست؛ رفتار آنالوگ کامل یا pulseIn واقعی محدود است.
- مدل ۳D: مدل‌های بازرس با three.js و **هندسه‌ی ساده‌شده‌ی درون کد** ساخته می‌شوند (نه CAD واقعی Adafruit)؛ در UI «مدل ساده‌شده» نوشته شده. تبدیل STEP→GLB هنوز انجام نشده.
- لینک اشتراک فقط در همان مرورگر باز می‌شود (localStorage)؛ اشتراک واقعی نیاز به ذخیره‌ی سمت سرور دارد.
- شبیه‌ساز فقط D13 (PORTB5) را گزارش می‌کند؛ LEDهای روی پایه‌های دیگر روشن نمی‌شوند.
