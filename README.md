# PushRSP Suite

Monorepo for the live PushRSP product suite (synced from server `77.221.156.164` / `/opt/pushrsp`).

## Packages

| Folder | Product | Upstream repo | Live URL |
|--------|---------|---------------|----------|
| `market/` | فروشگاه + آزمایشگاه مجازی | [pushrsp-market](https://github.com/AmirSarani/pushrsp-market) | http://77.221.156.164/pushrsp |
| `portfolio-web/` | سایت پورتفولیو | [portfolio-web](https://github.com/AmirSarani/portfolio-web) | http://77.221.156.164/portfolio |
| `portfolio-admin/` | ادمین پورتفولیو | [portfolio-admin](https://github.com/AmirSarani/portfolio-admin) | http://77.221.156.164/portfolio-admin/ |

## Handoff

- **[docs/SERVER_HANDOFF.md](docs/SERVER_HANDOFF.md)** — paths, nginx, systemd, env keys, lab, seeds, security notes  
- **[docs/SUITE_GIT_SYNC.md](docs/SUITE_GIT_SYNC.md)** — git sync commit SHAs from 2026-09-19  

Also on server: `/opt/pushrsp/HANDOFF.md`

## Quick start (local)

```bash
# Shop
cd market && npm i && npm run db:setup && npm run dev

# Portfolio site
cd portfolio-web && npm i && npm run db:setup && npm run dev

# Portfolio admin (needs portfolio-web API)
cd portfolio-admin && npm i && npm run dev
```

Use each package’s `.env.example` — never commit real `.env` or `*.db`.

### Whole suite on one origin (like the server)

Each app only answers under its basePath, and cross-app links assume one domain. With the three dev servers running, start the local stand-in for nginx (Node ≥ 22.18):

```bash
node scripts/dev-proxy.ts   # → http://localhost:8080  (/pushrsp, /portfolio, /portfolio-admin/)
```

For links between the apps to stay local, set in the env files:

| File | Value |
|------|-------|
| `market/.env` | `NEXT_PUBLIC_PORTFOLIO_URL=http://localhost:8080/portfolio` |
| `portfolio-web/.env` | `NEXT_PUBLIC_MARKET_URL=http://localhost:8080/pushrsp` |
| `portfolio-admin/.env.local` | `VITE_API_BASE=/portfolio` and `VITE_SITE_URL=http://localhost:8080/portfolio` |

## Lab

See `market/docs/lab/README.md`. Adafruit CAD raw assets stay on server (`/opt/pushrsp/lab-assets`); run `npm run lab:sync` there.

## License notes

Shop lab includes Adafruit CAD Parts MIT attribution under `market/src/lab/licenses/` and `market/public/lab/`.
