/**
 * Real CAD sources for lab part 3D models. Each entry is converted STEP/FCStd -> GLB by
 * build.mjs and written to public/lab/models/<id>.glb. Parts not listed here keep the
 * in-code procedural model (src/lab/visuals/models-3d.ts) — usually because no suitable
 * free model exists (dht22, pir), or the real model is worse for teaching purposes
 * (breadboard: a featureless box; resistor: no colour bands to read the value from).
 *
 * License terms (apply to the converted model file only, not to Facksten's own code):
 *   - MIT        — Adafruit_CAD_Parts, https://github.com/adafruit/Adafruit_CAD_Parts
 *   - CC-BY-3.0  — FreeCAD-library, https://github.com/FreeCAD/FreeCAD-library
 *   - CC-BY-SA-4.0 — kicad-packages3D, https://gitlab.com/kicad/libraries/kicad-packages3D
 * Full license texts are in src/lab/licenses/.
 */

const ADAFRUIT_RAW = "https://raw.githubusercontent.com/adafruit/Adafruit_CAD_Parts/main";
const FREECAD_RAW = "https://raw.githubusercontent.com/FreeCAD/FreeCAD-library/master";
const KICAD_RAW = "https://gitlab.com/kicad/libraries/kicad-packages3D/-/raw/master";

/** @typedef {{
 *   id: string, format: 'step'|'fcstd', url: string,
 *   license: string, licenseId: 'MIT'|'CC-BY-3.0'|'CC-BY-SA-4.0',
 *   sourceUrl: string, author: string,
 *   recolor?: { color: [number, number, number] },
 *   simplify?: { ratio: number, error: number },
 * }} ModelSource */

/** @type {ModelSource[]} */
export const MODEL_SOURCES = [
  {
    id: "arduino-uno",
    format: "fcstd",
    url: `${FREECAD_RAW}/Electronics%20Parts/Boards/Arduino/Arduino%20UNO/Arduino%20UNO.FCStd`,
    license: "CC-BY-3.0",
    licenseId: "CC-BY-3.0",
    sourceUrl: "https://github.com/FreeCAD/FreeCAD-library/tree/master/Electronics%20Parts/Boards/Arduino/Arduino%20UNO",
    author: "FreeCAD-library contributors",
    // ~197k source triangles (mostly rounded header-pin legs); a preview thumbnail doesn't
    // need that precision, so simplify much harder than the default to keep the GLB small.
    simplify: { ratio: 0.06, error: 0.004 },
  },
  {
    id: "arduino-nano",
    format: "fcstd",
    url: `${FREECAD_RAW}/Electronics%20Parts/Boards/Arduino/Nano-Rev3_0.fcstd`,
    license: "CC-BY-3.0",
    licenseId: "CC-BY-3.0",
    sourceUrl: "https://github.com/FreeCAD/FreeCAD-library/blob/master/Electronics%20Parts/Boards/Arduino/Nano-Rev3_0.fcstd",
    author: "FreeCAD-library contributors",
    // Source has no native colour (single grey material) — tint the PCB blue like a real Nano clone.
    recolor: { color: [0.11, 0.32, 0.72] },
  },
  {
    id: "led-red",
    format: "step",
    url: `${KICAD_RAW}/LED_THT.3dshapes/LED_D5.0mm.step`,
    license: "CC-BY-SA-4.0",
    licenseId: "CC-BY-SA-4.0",
    sourceUrl: "https://gitlab.com/kicad/libraries/kicad-packages3D/-/blob/master/LED_THT.3dshapes/LED_D5.0mm.step",
    author: "KiCad libraries contributors",
  },
  {
    id: "led-rgb",
    format: "step",
    url: `${KICAD_RAW}/LED_THT.3dshapes/LED_D5.0mm-4_RGB.step`,
    license: "CC-BY-SA-4.0",
    licenseId: "CC-BY-SA-4.0",
    sourceUrl: "https://gitlab.com/kicad/libraries/kicad-packages3D/-/blob/master/LED_THT.3dshapes/LED_D5.0mm-4_RGB.step",
    author: "KiCad libraries contributors",
  },
  {
    id: "button",
    format: "step",
    url: `${KICAD_RAW}/Button_Switch_THT.3dshapes/SW_PUSH_6mm.step`,
    license: "CC-BY-SA-4.0",
    licenseId: "CC-BY-SA-4.0",
    sourceUrl: "https://gitlab.com/kicad/libraries/kicad-packages3D/-/blob/master/Button_Switch_THT.3dshapes/SW_PUSH_6mm.step",
    author: "KiCad libraries contributors",
  },
  {
    id: "potentiometer",
    format: "step",
    url: `${ADAFRUIT_RAW}/562%2010K%20Potentiometer/562%2010K%20Potentiometer.step`,
    license: "MIT",
    licenseId: "MIT",
    sourceUrl: "https://github.com/adafruit/Adafruit_CAD_Parts/tree/main/562%2010K%20Potentiometer",
    author: "Adafruit Industries",
  },
  {
    id: "buzzer",
    format: "step",
    url: `${KICAD_RAW}/Buzzer_Beeper.3dshapes/Buzzer_12x9.5RM7.6.step`,
    license: "CC-BY-SA-4.0",
    licenseId: "CC-BY-SA-4.0",
    sourceUrl: "https://gitlab.com/kicad/libraries/kicad-packages3D/-/blob/master/Buzzer_Beeper.3dshapes/Buzzer_12x9.5RM7.6.step",
    author: "KiCad libraries contributors",
  },
  {
    id: "servo-sg90",
    format: "fcstd",
    url: `${FREECAD_RAW}/Electrical%20Parts/Servos/SG-90/Servo%20sg90.fcstd`,
    license: "CC-BY-3.0",
    licenseId: "CC-BY-3.0",
    sourceUrl: "https://github.com/FreeCAD/FreeCAD-library/tree/master/Electrical%20Parts/Servos/SG-90",
    author: "FreeCAD-library contributors",
  },
  {
    id: "hc-sr04",
    format: "fcstd",
    url: `${FREECAD_RAW}/Electronics%20Parts/Ultrasonic%20Sensors/HC-SR04.FCStd`,
    license: "CC-BY-3.0",
    licenseId: "CC-BY-3.0",
    sourceUrl: "https://github.com/FreeCAD/FreeCAD-library/tree/master/Electronics%20Parts/Ultrasonic%20Sensors",
    author: "FreeCAD-library contributors",
  },
  {
    id: "lcd-1602",
    format: "step",
    url: `${KICAD_RAW}/Display.3dshapes/WC1602A.step`,
    license: "CC-BY-SA-4.0",
    licenseId: "CC-BY-SA-4.0",
    sourceUrl: "https://gitlab.com/kicad/libraries/kicad-packages3D/-/blob/master/Display.3dshapes/WC1602A.step",
    author: "KiCad libraries contributors",
  },
  {
    id: "oled-128x64",
    format: "step",
    url: `${KICAD_RAW}/Display.3dshapes/Adafruit_SSD1306.step`,
    license: "CC-BY-SA-4.0",
    licenseId: "CC-BY-SA-4.0",
    sourceUrl: "https://gitlab.com/kicad/libraries/kicad-packages3D/-/blob/master/Display.3dshapes/Adafruit_SSD1306.step",
    author: "KiCad libraries contributors",
  },
];
