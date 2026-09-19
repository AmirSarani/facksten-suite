# Facksten / Su Portfolio — Server Handoff

> **Monorepo:** [AmirSarani/facksten-suite](https://github.com/AmirSarani/facksten-suite) (`main`) — folders `market/`, `portfolio-web/`, `portfolio-admin/` + `docs/`.


**تاریخ:** 2026-09-19 (Asia/Tehran)  
**سرور:** `77.221.156.164`  
**Agent مالک محصول:** Su Portfolio  
**ریپوهای GitHub (سورس):**

| محصول | Repo |
|--------|------|
| فروشگاه | `AmirSarani/facksten-market` |
| سایت پورتفولیو | `AmirSarani/portfolio-web` |
| ادمین پورتفولیو | `AmirSarani/portfolio-admin` |

> روی سرور بسیاری از پچ‌ها (basePath، lab، ریسپانسیو، بنرها) **مستقیم روی دیپلوی** اعمال شده‌اند و ممکن است هنوز همه به GitHub push نشده باشند. قبل از overwrite از سرور بکاپ بگیرید.

---

## ۱) URLهای عمومی

| سرویس | URL |
|--------|-----|
| فروشگاه | http://77.221.156.164/facksten |
| آزمایشگاه مجازی | http://77.221.156.164/facksten/lab |
| میز کار lab | http://77.221.156.164/facksten/lab/workspace |
| پورتفولیو (FA، بدون `/fa`) | http://77.221.156.164/portfolio |
| پورتفولیو EN | http://77.221.156.164/portfolio/en |
| ادمین پورتفولیو | http://77.221.156.164/portfolio-admin/ |

**پیوند متقابل**

- هدر فروشگاه → «نمونه کارها» / «آزمایشگاه مجازی»
- هدر پورتفولیو → «فروشگاه» → `/facksten`
- ادمین پورتفولیو → «← سایت» / «بازگشت به سایت» → `/portfolio`

---

## ۲) مسیرهای روی دیسک سرور

ریشه ایزوله:

```text
/opt/facksten/
├── app/                 # فروشگاه Next.js (basePath=/facksten)
├── portfolio-web/       # سایت پورتفولیو Next.js (basePath=/portfolio)
├── portfolio-admin/     # SPA Vite → dist/
├── lab-assets/          # ایندکس/اتریبیوشن Adafruit CAD (خارج از باندل کلاینت)
└── README.txt
```

| نقش | مسیر |
|------|------|
| کد فروشگاه | `/opt/facksten/app` |
| DB فروشگاه | `/opt/facksten/app/prod.db` (`DATABASE_URL=file:…`) |
| کد پورتفولیو | `/opt/facksten/portfolio-web` |
| DB پورتفولیو | `/opt/facksten/portfolio-web/prod.db` |
| ادمین (static) | `/opt/facksten/portfolio-admin/dist/` |
| Lab assets sync | `/opt/facksten/lab-assets` |
| تصاویر فروشگاه (nginx) | `/opt/facksten/app/public/images/` |
| کاور/آواتار پورتفولیو | `/opt/facksten/portfolio-web/public/covers/` ، `…/avatars/` |

---

## ۳) پروسه‌ها (systemd)

| Unit | WorkingDirectory | Bind |
|------|------------------|------|
| `facksten-market.service` | `/opt/facksten/app` | `127.0.0.1:13010` |
| `facksten-portfolio.service` | `/opt/facksten/portfolio-web` | `127.0.0.1:13020` |

```bash
systemctl status facksten-market facksten-portfolio
systemctl restart facksten-market
systemctl restart facksten-portfolio
```

ادمین پورتفولیو پروسس Node ندارد؛ فقط فایل‌های `dist/` پشت nginx است. بعد از تغییر:

```bash
cd /opt/facksten/portfolio-admin && npm run build
# nginx همان alias را سرو می‌کند
```

---

## ۴) Nginx

- Site: `/etc/nginx/sites-enabled/deepseek-ip` (`server_name 77.221.156.164`)
- Snippet: `/etc/nginx/snippets/facksten-market.conf`

خلاصه locationها:

- `/facksten` → proxy `:13010`
- `/portfolio` → proxy `:13020` (و `=/portfolio/` → 301 به بدون اسلش)
- `/portfolio/fa` → 301 به مسیر بدون `/fa`
- `/portfolio-admin/` → alias `portfolio-admin/dist/`
- `/images/`، `/downloads/` → public فروشگاه
- `/covers/`، `/avatars/` → public پورتفولیو

```bash
nginx -t && nginx -s reload
```

---

## ۵) Env مهم (بدون secret)

**فروشگاه** `/opt/facksten/app/.env`

- `DATABASE_URL=file:/opt/facksten/app/prod.db`
- `NEXT_PUBLIC_PORTFOLIO_URL=http://77.221.156.164/portfolio`

**پورتفولیو** `/opt/facksten/portfolio-web/.env`

- `DATABASE_URL=file:/opt/facksten/portfolio-web/prod.db`
- `NEXT_PUBLIC_SITE_URL=http://77.221.156.164/portfolio`
- `NEXT_PUBLIC_BASE_PATH=/portfolio`
- `NEXT_PUBLIC_MARKET_URL=http://77.221.156.164/facksten`
- `COOKIE_SECURE=false` ، `SESSION_SAMESITE=lax` (HTTP)
- `SESSION_SECRET` — در سرور موجود است؛ در چت تکرار نشود؛ در صورت لو رفتن بچرخانید

**ادمین** `/opt/facksten/portfolio-admin/.env`

- `VITE_API_BASE=http://77.221.156.164/portfolio`
- `VITE_SITE_URL=http://77.221.156.164/portfolio`

---

## ۶) حساب‌های seed (محیط تست)

| سیستم | ایمیل | رمز (seed) |
|--------|--------|------------|
| فروشگاه | `user@facksten.com` | `Pass123!` |
| ادمین پورتفولیو | `admin@facksten.local` | `ChangeMe123!` |

در پروداکشن رمزها را عوض کنید. **رمز root سرور قبلاً در چت آمده — باید rotate شود.**

---

## ۷) قابلیت‌های مهم دیپلوی‌شده (خلاصه)

### فروشگاه (`/facksten`)

- basePath `/facksten`، هدر ثابت، جمع‌شدن نوار ارسال رایگان + سرچ با اسکرول
- بنر پورتفولیو (بالا) و بنر آزمایشگاه (پایین‌تر، بعد از PromoBand)
- پنل‌ها: `/facksten/account` ، `/partner` ، `/admin`
- **آزمایشگاه مجازی:** `/lab` — Blink با avr8js + avr-gcc، سیم‌کشی، BOM→سبد، docs در `docs/lab/README.md`
- اسکریپت sync: `npm run lab:sync` → `/opt/facksten/lab-assets`

### پورتفولیو (`/portfolio`)

- FA بدون پیشوند `/fa`؛ EN زیر `/en`
- هدر «فروشگاه»؛ سوییچ زبان با ناوبری سخت
- ادمین با کوکی ۱۴روزه `facksten_portfolio_admin` و دکمه بازگشت به سایت

---

## ۸) بیلد / ری‌استارت سریع

```bash
# فروشگاه
cd /opt/facksten/app
npm run build && systemctl restart facksten-market

# پورتفولیو
cd /opt/facksten/portfolio-web
npm run build && systemctl restart facksten-portfolio

# ادمین
cd /opt/facksten/portfolio-admin
npm run build
```

تست lab:

```bash
cd /opt/facksten/app && npm run test:lab
```

---

## ۹) Git روی سرور

| مسیر | remote |
|------|--------|
| `/opt/facksten/app` | (ممکن است remote خالی / دیپلوی کپی باشد — با `git -C … remote -v` چک کنید) |
| `/opt/facksten/portfolio-web` | `https://github.com/AmirSarani/portfolio-web.git` |
| `/opt/facksten/portfolio-admin` | `https://github.com/AmirSarani/portfolio-admin.git` |

پچ‌های سرور ≠ لزوماً آخرین commit GitHub. برای handoff کد: diff سرور را commit/push کنید یا tarball بگیرید.

---

## ۱۰) نکات امنیتی / بدهی فنی

1. Rotate رمز root سرور و seed ادمین‌ها  
2. HTTPS هنوز روی IP خام نیست — کوکی ادمین برای HTTP روی Lax تنظیم شده  
3. مدل‌های ۳D lab هنوز عمدتاً placeholder؛ pipeline GLB در `lab:sync` / docs توضیح داده شده  
4. SPICE / اسیلوسکوپ عمیق در lab نیست (صادقانه محدود)

---

*تولید شده برای handoff عملیاتی Su Portfolio / Facksten — 2026-09-19*
