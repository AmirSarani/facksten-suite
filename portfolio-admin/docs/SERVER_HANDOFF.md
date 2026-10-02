# PushRSP / Su Portfolio — Server Handoff

**تاریخ:** 2026-09-19 (Asia/Tehran)  
**سرور:** `77.221.156.164`  
**Agent مالک محصول:** Su Portfolio  
**ریپوهای GitHub (سورس):**

| محصول | Repo |
|--------|------|
| فروشگاه | `AmirSarani/pushrsp-market` |
| سایت پورتفولیو | `AmirSarani/portfolio-web` |
| ادمین پورتفولیو | `AmirSarani/portfolio-admin` |

> روی سرور بسیاری از پچ‌ها (basePath، lab، ریسپانسیو، بنرها) **مستقیم روی دیپلوی** اعمال شده‌اند و ممکن است هنوز همه به GitHub push نشده باشند. قبل از overwrite از سرور بکاپ بگیرید.

---

## ۱) URLهای عمومی

| سرویس | URL |
|--------|-----|
| فروشگاه | http://77.221.156.164/pushrsp |
| آزمایشگاه مجازی | http://77.221.156.164/pushrsp/lab |
| میز کار lab | http://77.221.156.164/pushrsp/lab/workspace |
| پورتفولیو (FA، بدون `/fa`) | http://77.221.156.164/portfolio |
| پورتفولیو EN | http://77.221.156.164/portfolio/en |
| ادمین پورتفولیو | http://77.221.156.164/portfolio-admin/ |

**پیوند متقابل**

- هدر فروشگاه → «نمونه کارها» / «آزمایشگاه مجازی»
- هدر پورتفولیو → «فروشگاه» → `/pushrsp`
- ادمین پورتفولیو → «← سایت» / «بازگشت به سایت» → `/portfolio`

---

## ۲) مسیرهای روی دیسک سرور

ریشه ایزوله:

```text
/opt/pushrsp/
├── app/                 # فروشگاه Next.js (basePath=/pushrsp)
├── portfolio-web/       # سایت پورتفولیو Next.js (basePath=/portfolio)
├── portfolio-admin/     # SPA Vite → dist/
├── lab-assets/          # ایندکس/اتریبیوشن Adafruit CAD (خارج از باندل کلاینت)
└── README.txt
```

| نقش | مسیر |
|------|------|
| کد فروشگاه | `/opt/pushrsp/app` |
| DB فروشگاه | `/opt/pushrsp/app/prod.db` (`DATABASE_URL=file:…`) |
| کد پورتفولیو | `/opt/pushrsp/portfolio-web` |
| DB پورتفولیو | `/opt/pushrsp/portfolio-web/prod.db` |
| ادمین (static) | `/opt/pushrsp/portfolio-admin/dist/` |
| Lab assets sync | `/opt/pushrsp/lab-assets` |
| تصاویر فروشگاه (nginx) | `/opt/pushrsp/app/public/images/` |
| کاور/آواتار پورتفولیو | `/opt/pushrsp/portfolio-web/public/covers/` ، `…/avatars/` |

---

## ۳) پروسه‌ها (systemd)

| Unit | WorkingDirectory | Bind |
|------|------------------|------|
| `pushrsp-market.service` | `/opt/pushrsp/app` | `127.0.0.1:13010` |
| `pushrsp-portfolio.service` | `/opt/pushrsp/portfolio-web` | `127.0.0.1:13020` |

```bash
systemctl status pushrsp-market pushrsp-portfolio
systemctl restart pushrsp-market
systemctl restart pushrsp-portfolio
```

ادمین پورتفولیو پروسس Node ندارد؛ فقط فایل‌های `dist/` پشت nginx است. بعد از تغییر:

```bash
cd /opt/pushrsp/portfolio-admin && npm run build
# nginx همان alias را سرو می‌کند
```

---

## ۴) Nginx

- Site: `/etc/nginx/sites-enabled/deepseek-ip` (`server_name 77.221.156.164`)
- Snippet: `/etc/nginx/snippets/pushrsp-market.conf`

خلاصه locationها:

- `/pushrsp` → proxy `:13010`
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

**فروشگاه** `/opt/pushrsp/app/.env`

- `DATABASE_URL=file:/opt/pushrsp/app/prod.db`
- `NEXT_PUBLIC_PORTFOLIO_URL=http://77.221.156.164/portfolio`

**پورتفولیو** `/opt/pushrsp/portfolio-web/.env`

- `DATABASE_URL=file:/opt/pushrsp/portfolio-web/prod.db`
- `NEXT_PUBLIC_SITE_URL=http://77.221.156.164/portfolio`
- `NEXT_PUBLIC_BASE_PATH=/portfolio`
- `NEXT_PUBLIC_MARKET_URL=http://77.221.156.164/pushrsp`
- `COOKIE_SECURE=false` ، `SESSION_SAMESITE=lax` (HTTP)
- `SESSION_SECRET` — در سرور موجود است؛ در چت تکرار نشود؛ در صورت لو رفتن بچرخانید

**ادمین** `/opt/pushrsp/portfolio-admin/.env`

- `VITE_API_BASE=http://77.221.156.164/portfolio`
- `VITE_SITE_URL=http://77.221.156.164/portfolio`

---

## ۶) حساب‌های seed (محیط تست)

| سیستم | ایمیل | رمز (seed) |
|--------|--------|------------|
| فروشگاه | `user@pushrsp.com` | `<SEED_PASSWORD>` |
| ادمین پورتفولیو | `admin@pushrsp.local` | `<SEED_ADMIN_PASSWORD>` |

در پروداکشن رمزها را عوض کنید. **رمز root سرور قبلاً در چت آمده — باید rotate شود.**

---

## ۷) قابلیت‌های مهم دیپلوی‌شده (خلاصه)

### فروشگاه (`/pushrsp`)

- basePath `/pushrsp`، هدر ثابت، جمع‌شدن نوار ارسال رایگان + سرچ با اسکرول
- بنر پورتفولیو (بالا) و بنر آزمایشگاه (پایین‌تر، بعد از PromoBand)
- پنل‌ها: `/pushrsp/account` ، `/partner` ، `/admin`
- **آزمایشگاه مجازی:** `/lab` — Blink با avr8js + avr-gcc، سیم‌کشی، BOM→سبد، docs در `docs/lab/README.md`
- اسکریپت sync: `npm run lab:sync` → `/opt/pushrsp/lab-assets`

### پورتفولیو (`/portfolio`)

- FA بدون پیشوند `/fa`؛ EN زیر `/en`
- هدر «فروشگاه»؛ سوییچ زبان با ناوبری سخت
- ادمین با کوکی ۱۴روزه `pushrsp_portfolio_admin` و دکمه بازگشت به سایت

---

## ۸) بیلد / ری‌استارت سریع

```bash
# فروشگاه
cd /opt/pushrsp/app
npm run build && systemctl restart pushrsp-market

# پورتفولیو
cd /opt/pushrsp/portfolio-web
npm run build && systemctl restart pushrsp-portfolio

# ادمین
cd /opt/pushrsp/portfolio-admin
npm run build
```

تست lab:

```bash
cd /opt/pushrsp/app && npm run test:lab
```

---

## ۹) Git روی سرور

| مسیر | remote |
|------|--------|
| `/opt/pushrsp/app` | (ممکن است remote خالی / دیپلوی کپی باشد — با `git -C … remote -v` چک کنید) |
| `/opt/pushrsp/portfolio-web` | `https://github.com/AmirSarani/portfolio-web.git` |
| `/opt/pushrsp/portfolio-admin` | `https://github.com/AmirSarani/portfolio-admin.git` |

پچ‌های سرور ≠ لزوماً آخرین commit GitHub. برای handoff کد: diff سرور را commit/push کنید یا tarball بگیرید.

---

## ۱۰) نکات امنیتی / بدهی فنی

1. Rotate رمز root سرور و seed ادمین‌ها  
2. HTTPS هنوز روی IP خام نیست — کوکی ادمین برای HTTP روی Lax تنظیم شده  
3. مدل‌های ۳D lab هنوز عمدتاً placeholder؛ pipeline GLB در `lab:sync` / docs توضیح داده شده  
4. SPICE / اسیلوسکوپ عمیق در lab نیست (صادقانه محدود)

---

*تولید شده برای handoff عملیاتی Su Portfolio / PushRSP — 2026-09-19*
