# Lab asset attribution

## 3D preview models (public/lab/models/*.glb)

Converted (STEP/FCStd → GLB, simplified, no textures) by `scripts/lab-models/build.mjs`.
Per-part attribution: `public/lab/models/CREDITS.md`. Full license texts below.

- **Adafruit_CAD_Parts** (MIT) — https://github.com/adafruit/Adafruit_CAD_Parts
  License text: `ADAFRUIT_CAD_PARTS_MIT.txt`
- **FreeCAD-library** (CC-BY 3.0) — https://github.com/FreeCAD/FreeCAD-library
  License text: `FREECAD_LIBRARY_CC_BY_3.txt`
- **kicad-packages3D** (CC-BY-SA 4.0) — https://gitlab.com/kicad/libraries/kicad-packages3D
  License text: `KICAD_PACKAGES3D_CC_BY_SA_4.txt`

Parts without a free/open CAD source (breadboard, resistors, DHT22, PIR) keep the in-code
procedural model (`src/lab/visuals/models-3d.ts`) — for the breadboard and resistors this is
also the better choice: the free models are a featureless box and colourless body
respectively, and the in-code resistor draws the actual value's colour bands.

Sync script: `scripts/lab-sync-adafruit.mjs` (legacy — populates
`public/lab/catalog-index.json`; superseded for 3D previews by `lab:models` above).

## Other

- **avr8js** (MIT) — AVR CPU simulation used for Blink / Uno path.
- Facksten Lab UI and wiring logic — Facksten / shop codebase.
