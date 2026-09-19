# portfolio-admin

Facksten portfolio admin panel — local CMS UI against **portfolio-web**.

A React SPA for CMS CRUD against **portfolio-web** (Next.js) at `http://localhost:3020`. Session cookies are issued by portfolio-web admin auth, not facksten-market.

## Local run

```bash
cp .env.example .env
npm install
npm run dev
```

Vite listens on **http://localhost:5174**.

The public site / CMS API must be running separately with a seeded admin:

```bash
# in portfolio-web
npm run dev   # expected on :3020
```

Seed admin (portfolio-web): `admin@facksten.local` / `ChangeMe123!`

If the API is down, the UI still loads. Lists and login show a clear unreachable/empty/error state. Upload and legal save require a live session.

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE` | `http://localhost:3020` | portfolio-web origin |

Copy `.env.example` → `.env`. All `fetch` calls use `credentials: "include"`.

portfolio-web must allow CORS from `http://localhost:5174` and set cookie `SameSite=Lax` (or `None; Secure` only if you leave localhost HTTP).

## Auth (portfolio-web)

| Method | Path | Body |
|---|---|---|
| `POST` | `/api/admin/auth/login` | `{ email, password }` |
| `POST` | `/api/admin/auth/logout` | — |
| `GET` | `/api/admin/auth/me` | cookie session |

## CMS API assumed

| Resource | Routes |
|---|---|
| Services | `GET/POST /api/admin/services`, `GET/PATCH/DELETE /api/admin/services/:id` |
| Projects | same under `/api/admin/projects` |
| Team | same under `/api/admin/team` |
| Settings | same under `/api/admin/settings` |
| Legal | `GET/PUT /api/admin/legal` (FA/EN privacy + terms) |
| Upload | `POST /api/admin/upload` multipart `file` → `{ url: "/api/media/<hex>.ext" }` |
| Leads | `GET /api/admin/leads` (read-only) |

Service / project / team payloads use bilingual fields (`titleFa`/`titleEn`, summaries, bodies), `status: DRAFT | PUBLISHED`, and `sortOrder`. Project editors upload images into `coverUrl` and `media[]`. Settings store a `key` plus JSON `value`.

List responses may be a raw array or `{ items | data | results }`.

## File map

```
src/
  lib/api.ts          typed fetch client + resource helpers
  lib/auth.tsx        cookie session (login / logout / me)
  components/         cyber shell, bilingual fields, status toggle
  pages/              login, dashboard, CRUD UIs, legal, leads
```

## Scripts

- `npm run dev` — Vite on 5174
- `npm test` — Vitest
- `npm run build` — `tsc -b && vite build`
- `npm run preview` — production preview on 5174

Local only. No deploy.
