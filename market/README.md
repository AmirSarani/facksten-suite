# Facksten Market

فروشگاه Facksten با سه پنل واقعی: مشتری، همکار، ادمین.

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
| ادمین | admin@facksten.com | Pass123! |
| همکار | partner@facksten.com | Pass123! |
| مشتری | user@facksten.com | Pass123! |

## مسیرها

- فروشگاه عمومی: `/` `/shop` `/product/...` `/cart` `/checkout/...`
- مشتری: `/account/*`
- همکار: `/partner/*`
- ادمین: `/admin/*`

`E:/cursor/facksten` جدا و دست‌نخورده است.
