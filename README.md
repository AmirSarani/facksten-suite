# Facksten Suite

Monorepo for the live Facksten product suite (synced from server `77.221.156.164` / `/opt/facksten`).

## Packages

| Folder | Product | Upstream repo | Live URL |
|--------|---------|---------------|----------|
| `market/` | فروشگاه + آزمایشگاه مجازی | [facksten-market](https://github.com/AmirSarani/facksten-market) | http://77.221.156.164/facksten |
| `portfolio-web/` | سایت پورتفولیو | [portfolio-web](https://github.com/AmirSarani/portfolio-web) | http://77.221.156.164/portfolio |
| `portfolio-admin/` | ادمین پورتفولیو | [portfolio-admin](https://github.com/AmirSarani/portfolio-admin) | http://77.221.156.164/portfolio-admin/ |

## Handoff

- **[docs/SERVER_HANDOFF.md](docs/SERVER_HANDOFF.md)** — paths, nginx, systemd, env keys, lab, seeds, security notes  
- **[docs/SUITE_GIT_SYNC.md](docs/SUITE_GIT_SYNC.md)** — git sync commit SHAs from 2026-09-19  

Also on server: `/opt/facksten/HANDOFF.md`

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

## Lab

See `market/docs/lab/README.md`. Adafruit CAD raw assets stay on server (`/opt/facksten/lab-assets`); run `npm run lab:sync` there.

## License notes

Shop lab includes Adafruit CAD Parts MIT attribution under `market/src/lab/licenses/` and `market/public/lab/`.
