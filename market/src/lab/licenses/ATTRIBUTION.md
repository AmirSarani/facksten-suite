# Lab asset attribution

- **Adafruit_CAD_Parts** (MIT) — mechanical CAD / STEP sources for many common electronics parts.
  Repository: https://github.com/adafruit/Adafruit_CAD_Parts
- Sync script: `scripts/lab-sync-adafruit.mjs` clones/sparses into `/opt/facksten/lab-assets` (outside the Next.js public JS bundle).
- GLB conversion requires `gltf-pipeline` / assimp when available; otherwise parts remain listed with `simulationStatus` and `sourceUrl` pointing at GitHub.
- **avr8js** (MIT) — AVR CPU simulation used for Blink / Uno path.
- Facksten Lab UI and wiring logic — Facksten / shop codebase.
