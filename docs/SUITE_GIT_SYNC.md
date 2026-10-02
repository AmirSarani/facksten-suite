# PushRSP Suite — Git Sync Handoff (2026-09-19)

This push mirrors the **live deploy** on `77.221.156.164` under `/opt/pushrsp/` for all three products.

| Repo | Branch | Live path | Public URL |
|------|--------|-----------|------------|
| [AmirSarani/pushrsp-market](https://github.com/AmirSarani/pushrsp-market) | `master` | `/opt/pushrsp/app` | http://77.221.156.164/pushrsp |
| [AmirSarani/portfolio-web](https://github.com/AmirSarani/portfolio-web) | `main` | `/opt/pushrsp/portfolio-web` | http://77.221.156.164/portfolio |
| [AmirSarani/portfolio-admin](https://github.com/AmirSarani/portfolio-admin) | `main` | `/opt/pushrsp/portfolio-admin` | http://77.221.156.164/portfolio-admin/ |

Full operational detail: `docs/SERVER_HANDOFF.md` in each repo; on server `/opt/pushrsp/HANDOFF.md`.

**Not in git:** `.env*`, `*.db`, `node_modules`, `.next`, `dist`, raw `/opt/pushrsp/lab-assets` (~3GB). Use `npm run lab:sync` on server for Adafruit index.

**Included:** basePath deploy code, responsive fixes, shop↔portfolio links, virtual lab `/lab`, homepage promos, admin back-to-site + 14d cookie, FA-without-`/fa` routing.

## Git commits pushed (this sync)

- pushrsp-market: `abec0a8` on `master` — https://github.com/AmirSarani/pushrsp-market
- portfolio-web: `7ad000d` on `main` — https://github.com/AmirSarani/portfolio-web
- portfolio-admin: `ec9bfd3` on `main` — https://github.com/AmirSarani/portfolio-admin
