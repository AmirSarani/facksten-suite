#!/usr/bin/env node
/**
 * Sparse-sync Adafruit_CAD_Parts outside the Next public JS bundle.
 * Writes public/lab/catalog-index.json + copies MIT license.
 * GLB conversion is optional (gltf-pipeline / assimp) — missing tools = 3d-only stubs.
 */
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdirSync,
  writeFileSync,
  copyFileSync,
  existsSync,
  readdirSync,
  cpSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ASSETS = process.env.LAB_ASSETS_DIR || "/opt/facksten/lab-assets";
const REPO = join(ASSETS, "Adafruit_CAD_Parts");
const PUBLIC_LAB = join(ROOT, "public", "lab");
const LICENSE_SRC = join(ROOT, "src", "lab", "licenses", "ADAFRUIT_CAD_PARTS_MIT.txt");

mkdirSync(ASSETS, { recursive: true });
mkdirSync(PUBLIC_LAB, { recursive: true });
mkdirSync(join(PUBLIC_LAB, "models"), { recursive: true });

function hasCmd(cmd) {
  const r = spawnSync("which", [cmd], { encoding: "utf8" });
  return r.status === 0;
}

if (!existsSync(REPO)) {
  console.log("Cloning Adafruit_CAD_Parts (sparse)…");
  try {
    execFileSync(
      "git",
      [
        "clone",
        "--depth",
        "1",
        "--filter=blob:none",
        "--sparse",
        "https://github.com/adafruit/Adafruit_CAD_Parts.git",
        REPO,
      ],
      { stdio: "inherit" },
    );
    try {
      execFileSync("git", ["-C", REPO, "sparse-checkout", "disable"], { stdio: "inherit" });
    } catch {
      /* ok */
    }
  } catch (e) {
    console.warn("Clone failed — writing stub index only.", e.message);
  }
} else {
  console.log("Updating Adafruit_CAD_Parts…");
  try {
    execFileSync("git", ["-C", REPO, "pull", "--ff-only"], { stdio: "inherit" });
  } catch {
    console.warn("Pull skipped");
  }
}

const entries = [];
if (existsSync(REPO)) {
  const top = readdirSync(REPO, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .slice(0, 200);
  for (const d of top) {
    entries.push({
      id: d.name,
      name: d.name,
      sourceUrl: `https://github.com/adafruit/Adafruit_CAD_Parts/tree/main/${d.name}`,
      modelUrl: null,
      simulationStatus: "3d-only",
      note: "STEP/STL outside Next bundle; convert with gltf-pipeline/assimp when available",
    });
  }
}

const canConvert = hasCmd("assimp") || hasCmd("gltf-pipeline");
writeFileSync(
  join(PUBLIC_LAB, "catalog-index.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      assetRoot: ASSETS,
      glbConversionAvailable: canConvert,
      count: entries.length,
      parts: entries,
    },
    null,
    2,
  ),
);

if (existsSync(LICENSE_SRC)) {
  copyFileSync(LICENSE_SRC, join(PUBLIC_LAB, "ADAFRUIT_CAD_PARTS_MIT.txt"));
  copyFileSync(LICENSE_SRC, join(ASSETS, "LICENSE-MIT.txt"));
}

writeFileSync(
  join(PUBLIC_LAB, "models", "led-placeholder.json"),
  JSON.stringify({ type: "placeholder", part: "led", note: "GLB TBD" }),
);

console.log(
  `Wrote catalog-index.json (${entries.length} parts). GLB tools: ${canConvert ? "yes" : "no — 3d-only stubs"}`,
);
