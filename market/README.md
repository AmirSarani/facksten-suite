# PushRSP Market

فروشگاه PushRSP با سه پنل واقعی: مشتری، همکار، ادمین.

## اجرا

```bash
npm install
npm run db:setup
npm run start:fast
```

یا توسعه:

```bash
npm run db:setup
npm run dev
```

آدرس: http://localhost:3010

## حساب‌های seed

| نقش | ایمیل | رمز |
|-----|--------|-----|
| ادمین | admin@pushrsp.com | <SEED_PASSWORD> |
| همکار | partner@pushrsp.com | <SEED_PASSWORD> |
| مشتری | user@pushrsp.com | <SEED_PASSWORD> |

## مسیرها

- فروشگاه عمومی: `/` `/shop` `/product/...` `/cart` `/checkout/...`
- مشتری: `/account/*`
- همکار: `/partner/*`
- ادمین: `/admin/*`

`E:/cursor/pushrsp` جدا و دست‌نخورده است.
