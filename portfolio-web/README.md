# portfolio-web

Facksten portfolio public site — Cyber DS, Persian-first (`fa` / RTL) + English (`en` / LTR). This repo owns the shared CMS (Prisma + SQLite locally) and the public storefront. `portfolio-admin` (separate Vite SPA on port 5174) calls the admin APIs.

Phase 1 is **local only**. Do not deploy. Do not make the repo public. No shared schema, session, or auth with `facksten-market`.

## Local run

```bash
cp .env.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Dev server: [http://localhost:3020](http://localhost:3020)

- `/` and `/fa` — Home (Persian, RTL)
- `/en` — Home (English, LTR)
- `/[locale]/services`, `/projects`, `/projects/[slug]`, `/about`, `/contact`
- Light legal: `/privacy`, `/terms`

## Environment

See `.env.example`:

```
DATABASE_URL="file:./dev.db"
SESSION_SECRET="facksten-portfolio-dev-secret-change-me-32"
NEXT_PUBLIC_SITE_URL="http://localhost:3020"
ADMIN_ORIGIN="http://localhost:5174"
```

`SESSION_SECRET` must be at least 32 characters (iron-session). Admin cookie name is `facksten_portfolio_admin` — separate from the market cookie.

Session cookie flags are env/protocol-driven so Chrome accepts them on `http://localhost`:

- Local / non-HTTPS: `SameSite=Lax`, `Secure=false` (`http://localhost:5174` and `:3020` are same-site).
- Production HTTPS: `SameSite=None`, `Secure=true` (true cross-origin admin).
- Overrides: `COOKIE_SECURE=true|false`, `SESSION_SAMESITE=lax|strict|none`. Invalid `None` without `Secure` is downgraded to `Lax`.

After login from `http://localhost:5174` (credentials included), Chrome should store `facksten_portfolio_admin` and `GET /api/admin/auth/me` should return the user. Logout clears the cookie with the same `sameSite` / `secure` / `path`.

## Seed admin

| Field    | Value                   |
|----------|-------------------------|
| Email    | `admin@facksten.local`  |
| Password | `ChangeMe123!`          |

Change this before any non-local use.

## API

CORS allows `http://localhost:5174` (credentials). Public routes return only `PUBLISHED` rows. Locale query: `?locale=fa|en` (default `fa`).

### Public (no auth)

- `GET /api/public/services?locale=fa|en`
- `GET /api/public/projects?locale=fa|en`
- `GET /api/public/projects/[slug]?locale=fa|en`
- `GET /api/public/team?locale=fa|en`
- `GET /api/public/settings`
- `GET /api/public/legal/privacy|terms?locale=fa|en` — body from `SiteSetting.legal`
- `POST /api/public/leads` `{ name, email, message, locale? }`

### Admin (cookie session)

- `POST /api/admin/auth/login` `{ email, password }`
- `POST /api/admin/auth/logout`
- `GET /api/admin/auth/me`
- CRUD ` /api/admin/services`, `/api/admin/projects`, `/api/admin/team`, `/api/admin/settings`
- `GET /api/admin/legal` · `PUT /api/admin/legal` `{ privacy, terms }` (FA/EN) — writes `SiteSetting.legal`
- `POST /api/admin/upload` multipart `file` (jpeg/png/webp/gif) → `{ url }` under `/api/media/:id` (opaque, no directory listing)
- `GET /api/admin/leads`

Call admin routes with `credentials: "include"` from the Vite app.

## Stack

Next.js App Router, TypeScript, Tailwind 4, Prisma 7 + SQLite, iron-session, Zod.

Design tokens match facksten-market Cyber DS: void `#0a0a0f`, accent `#FF7A00`, Vazirmatn (FA), Oxanium / JetBrains Mono (EN / HUD).
