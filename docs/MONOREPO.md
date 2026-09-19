# Facksten Suite — Monorepo

**Repo:** https://github.com/AmirSarani/facksten-suite  
**Branch:** `main`

## Layout

```
facksten-suite/
├── README.md
├── docs/
│   ├── SERVER_HANDOFF.md      # full server ops handoff
│   └── SUITE_GIT_SYNC.md      # individual-repo sync SHAs (2026-09-19)
├── market/                    # facksten-market (shop + /lab)
├── portfolio-web/             # public portfolio site
└── portfolio-admin/           # portfolio CMS SPA
```

## Also kept as separate repos

| Package | Standalone |
|---------|------------|
| market | https://github.com/AmirSarani/facksten-market (`master` / `abec0a8`) |
| portfolio-web | https://github.com/AmirSarani/portfolio-web (`main` / `7ad000d`) |
| portfolio-admin | https://github.com/AmirSarani/portfolio-admin (`main` / `ec9bfd3`) |

## Server

`/opt/facksten/{app,portfolio-web,portfolio-admin}` · HANDOFF `/opt/facksten/HANDOFF.md`
