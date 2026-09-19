# Facksten Suite — Git Sync Handoff (2026-09-19)

This push mirrors the **live deploy** on `77.221.156.164` under `/opt/facksten/` for all three products.

| Repo | Branch | Live path | Public URL |
|------|--------|-----------|------------|
| [AmirSarani/facksten-market](https://github.com/AmirSarani/facksten-market) | `master` | `/opt/facksten/app` | http://77.221.156.164/facksten |
| [AmirSarani/portfolio-web](https://github.com/AmirSarani/portfolio-web) | `main` | `/opt/facksten/portfolio-web` | http://77.221.156.164/portfolio |
| [AmirSarani/portfolio-admin](https://github.com/AmirSarani/portfolio-admin) | `main` | `/opt/facksten/portfolio-admin` | http://77.221.156.164/portfolio-admin/ |

Full operational detail: `docs/SERVER_HANDOFF.md` in each repo; on server `/opt/facksten/HANDOFF.md`.

**Not in git:** `.env*`, `*.db`, `node_modules`, `.next`, `dist`, raw `/opt/facksten/lab-assets` (~3GB). Use `npm run lab:sync` on server for Adafruit index.

**Included:** basePath deploy code, responsive fixes, shop↔portfolio links, virtual lab `/lab`, homepage promos, admin back-to-site + 14d cookie, FA-without-`/fa` routing.
