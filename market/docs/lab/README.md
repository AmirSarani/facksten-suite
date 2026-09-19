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

## کامپایلر و Worker

- `POST /api/lab/compile` کد Arduino-مانند را با shim در `scripts/lab-shim/` و `avr-gcc -mmcu=atmega328p` به Intel HEX تبدیل می‌کند.
- کلاینت HEX را به `Avr8Engine` می‌دهد؛ Worker (`avr8-worker.ts`) حلقه `avrInstruction` را اجرا و PORTB5 (D13) را گزارش می‌کند.
- کتابخانه‌های سنگین (Wire/LiquidCrystal و …) عمداً رد می‌شوند با پیام فارسی.

## همگام‌سازی Adafruit

`npm run lab:sync` → `/opt/facksten/lab-assets` + `public/lab/catalog-index.json`. فایل‌های STEP خام داخل باندل JS کلاینت نمی‌روند.

## محدودیت‌ها (صادقانه)

- SPICE کامل، اسیلوسکوپ واقعی، Logic Analyzer عمیق: خارج از محدوده MVP.
- Servo/HC-SR04: قالب و سیم‌کشی هست؛ رفتار آنالوگ کامل یا pulseIn واقعی محدود است.
- مدل ۳D: بدون ابزار تبدیل، placeholder «مدل سه‌بعدی به‌زودی».
