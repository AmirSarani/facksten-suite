#!/usr/bin/env node
/**
 * Convert the STEP/FCStd CAD sources listed in sources.mjs into GLB files for the lab's
 * 3D part preview, and write public/lab/models/CREDITS.md.
 *
 * Downloads are cached in scripts/lab-models/.cache/ (gitignored) so re-runs are instant.
 * Run: `npm run lab:models` (needs internet on first run per part).
 *
 * Not part of `next build` — the .glb outputs are committed to the repo like any other
 * public asset; this script only needs to run again when a part is added or a source
 * upstream is updated.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import occtimportjs from "occt-import-js";
import { Document, NodeIO } from "@gltf-transform/core";
import { EXTMeshoptCompression, KHRMeshQuantization } from "@gltf-transform/extensions";
import { dedup, prune, weld, quantize, simplify, meshopt } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import { MODEL_SOURCES } from "./sources.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const CACHE = join(HERE, ".cache");
const OUT_DIR = join(ROOT, "public", "lab", "models");
const GLOW_IDS = new Set(["led-red", "led-rgb"]);
const GLOW_NAME = "lab-glow";

mkdirSync(CACHE, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

const unpackRGBA = (v) => [((v >>> 24) & 255) / 255, ((v >>> 16) & 255) / 255, ((v >>> 8) & 255) / 255, (v & 255) / 255];
const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const saturation = ([r, g, b]) => Math.max(r, g, b) - Math.min(r, g, b);

/**
 * Downloads via curl, not Node's fetch: GitLab (Cloudflare) returns 403 to Node's
 * undici TLS fingerprint specifically, while curl and every browser work fine.
 */
async function download(url, dest) {
  if (existsSync(dest)) return;
  console.log(`  fetching ${url}`);
  const res = spawnSync(
    "curl",
    ["-sS", "-L", "--fail", "--retry", "8", "--retry-all-errors", "--retry-delay", "2", "--max-time", "300", "-o", dest, url],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  if (res.status !== 0) {
    throw new Error(`curl exit ${res.status} for ${url}: ${res.stderr?.toString().trim().slice(-200)}`);
  }
}

/** Builds one glTF document; STEP and FCStd branches both call these helpers. */
function makeBuilder() {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const root = doc.createNode("model").setRotation([-Math.SQRT1_2, 0, 0, Math.SQRT1_2]); // CAD Z-up -> glTF Y-up
  doc.createScene().addChild(root);
  const mats = new Map();
  const matFor = (rgba, transparency = 0) => {
    const key = rgba.map((v) => v.toFixed(3)).join(",") + "|" + transparency.toFixed(2);
    if (!mats.has(key)) {
      const [r, g, b] = rgba;
      const grey = saturation([r, g, b]) < 0.06;
      const metal = (grey && r + g + b > 1.8) || (r > 0.7 && g > 0.5 && b < 0.35);
      const mat = doc
        .createMaterial(key)
        .setBaseColorFactor([srgbToLinear(r), srgbToLinear(g), srgbToLinear(b), 1 - transparency])
        .setMetallicFactor(metal ? 0.85 : 0.05)
        .setRoughnessFactor(metal ? 0.35 : 0.6);
      if (transparency > 0.01) mat.setAlphaMode("BLEND");
      mats.set(key, { mat, rgba: [r, g, b] });
    }
    return mats.get(key).mat;
  };
  const addMesh = (name, pos, nrm, idx, groups) => {
    const posAcc = doc.createAccessor().setType("VEC3").setArray(pos).setBuffer(buffer);
    const nrmAcc = nrm ? doc.createAccessor().setType("VEC3").setArray(nrm).setBuffer(buffer) : null;
    const mesh = doc.createMesh(name);
    for (const g of groups) {
      const sub = new Uint32Array(g.tris.length * 3);
      g.tris.forEach((t, i) => sub.set(idx.subarray(t * 3, t * 3 + 3), i * 3));
      const prim = doc
        .createPrimitive()
        .setAttribute("POSITION", posAcc)
        .setIndices(doc.createAccessor().setType("SCALAR").setArray(sub).setBuffer(buffer))
        .setMaterial(matFor(g.rgba, g.transparency ?? 0));
      if (nrmAcc) prim.setAttribute("NORMAL", nrmAcc);
      mesh.addPrimitive(prim);
    }
    root.addChild(doc.createNode(name).setMesh(mesh));
  };
  return { doc, addMesh, mats };
}

async function convertStep(source) {
  const cachePath = join(CACHE, `${source.id}.step`);
  await download(source.url, cachePath);
  const occt = await occtimportjs();
  const res = occt.ReadStepFile(new Uint8Array(readFileSync(cachePath)), {
    linearUnit: "millimeter",
    linearDeflectionType: "bounding_box_ratio",
    linearDeflection: 0.0015,
    angularDeflection: 0.35,
  });
  if (!res.success) throw new Error(`occt could not read ${source.id}.step`);

  const { doc, addMesh, mats } = makeBuilder();
  let triangles = 0;
  for (const m of res.meshes) {
    const pos = new Float32Array(m.attributes.position.array);
    const nrm = m.attributes.normal ? new Float32Array(m.attributes.normal.array) : null;
    const idx = new Uint32Array(m.index.array);
    triangles += idx.length / 3;
    const base = m.color ?? [0.6, 0.6, 0.6];
    const groups = new Map();
    const faces = m.brep_faces?.length ? m.brep_faces : [{ first: 0, last: idx.length / 3 - 1 }];
    for (const f of faces) {
      const rgba = f.color ?? base;
      const key = rgba.join(",");
      if (!groups.has(key)) groups.set(key, { rgba, tris: [] });
      for (let t = f.first; t <= f.last; t++) groups.get(key).tris.push(t);
    }
    addMesh(m.name || "part", pos, nrm, idx, [...groups.values()]);
  }
  return { doc, mats, triangles };
}

/** FreeCAD .FCStd is a zip of Document.xml (shape refs) + GuiDocument.xml (per-object colour) + .brp shapes. */
async function convertFcstd(source) {
  const zipPath = join(CACHE, `${source.id}.fcstd`);
  await download(source.url, zipPath);
  const extractDir = join(CACHE, `${source.id}-fcstd`);
  if (!existsSync(extractDir) || readdirSync(extractDir).length === 0) {
    mkdirSync(extractDir, { recursive: true });
    execFileSync("tar", ["-xf", zipPath, "-C", extractDir]);
  }

  const docXml = readFileSync(join(extractDir, "Document.xml"), "utf8");
  const guiXml = readFileSync(join(extractDir, "GuiDocument.xml"), "utf8");

  const shapes = new Map();
  for (const m of docXml.matchAll(/<Object name="([^"]+)"[^>]*>([\s\S]*?)<\/Object>/g)) {
    const f = /<Property name="Shape" type="Part::PropertyPartShape">\s*<Part file="([^"]+\.brp)"/.exec(m[2]);
    if (f) shapes.set(m[1], f[1]);
  }
  const views = new Map();
  for (const m of guiXml.matchAll(/<ViewProvider name="([^"]+)"[^>]*>([\s\S]*?)<\/ViewProvider>/g)) {
    const body = m[2];
    const visible = /<Property name="Visibility" type="App::PropertyBool">\s*<Bool value="true"/.test(body);
    const shapeColor = /<Property name="ShapeColor"[^>]*>\s*<PropertyColor value="(\d+)"/.exec(body)?.[1];
    const material = /diffuseColor="(\d+)"[^>]*transparency="([\d.]+)"/.exec(body);
    const diffuse = /<Property name="DiffuseColor"[^>]*>\s*<ColorList file="([^"]+)"/.exec(body)?.[1];
    views.set(m[1], {
      visible,
      color: shapeColor ? Number(shapeColor) : material ? Number(material[1]) : 0xb0b0b0ff,
      transparency: material ? Number(material[2]) : 0,
      diffuse,
    });
  }
  const readColorList = (file) => {
    if (!file || !existsSync(join(extractDir, file))) return [];
    const b = readFileSync(join(extractDir, file));
    const n = b.readUInt32LE(0);
    return Array.from({ length: n }, (_, i) => b.readUInt32LE(4 + i * 4));
  };

  const { doc, addMesh, mats } = makeBuilder();
  let triangles = 0;
  let exported = 0;
  const failed = [];
  for (const [name, brp] of shapes) {
    const v = views.get(name);
    if (!v?.visible) continue;
    let res;
    try {
      // a bad shape can corrupt the WASM heap, so each one gets a fresh module instance
      const occt = await occtimportjs();
      res = occt.ReadBrepFile(new Uint8Array(readFileSync(join(extractDir, brp))), {
        linearUnit: "millimeter",
        linearDeflectionType: "bounding_box_ratio",
        linearDeflection: 0.0015,
        angularDeflection: 0.35,
      });
    } catch (e) {
      failed.push(`${name}: ${String(e.message || e).slice(0, 60)}`);
      continue;
    }
    if (!res.success) {
      failed.push(`${name}: not readable`);
      continue;
    }
    const faceColors = readColorList(v.diffuse);
    const transparency = v.transparency > 1 ? v.transparency / 100 : v.transparency;
    for (const m of res.meshes) {
      const pos = new Float32Array(m.attributes.position.array);
      const nrm = m.attributes.normal ? new Float32Array(m.attributes.normal.array) : null;
      const idx = new Uint32Array(m.index.array);
      triangles += idx.length / 3;
      const faces = m.brep_faces?.length ? m.brep_faces : [{ first: 0, last: idx.length / 3 - 1 }];
      const groups = new Map();
      faces.forEach((f, i) => {
        const packed = faceColors.length === faces.length ? faceColors[i] : faceColors.length === 1 ? faceColors[0] : v.color;
        if (!groups.has(packed)) groups.set(packed, { rgba: unpackRGBA(packed), transparency, tris: [] });
        for (let t = f.first; t <= f.last; t++) groups.get(packed).tris.push(t);
      });
      addMesh(name, pos, nrm, idx, [...groups.values()]);
    }
    exported++;
  }
  if (failed.length) console.log(`  (skipped ${failed.length} unreadable shape(s): ${failed.join("; ")})`);
  return { doc, mats, triangles, exported };
}

async function main() {
  await MeshoptEncoder.ready;
  await MeshoptSimplifier.ready;
  const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({ "meshopt.encoder": MeshoptEncoder });

  const rows = [];
  for (const source of MODEL_SOURCES) {
    process.stdout.write(`${source.id} (${source.format}) …\n`);
    const t0 = performance.now();
    try {
      const { doc, mats, triangles } = source.format === "fcstd" ? await convertFcstd(source) : await convertStep(source);

      if (source.recolor && mats.size <= 1) {
        for (const { mat } of mats.values()) {
          const [r, g, b] = source.recolor.color;
          mat.setBaseColorFactor([srgbToLinear(r), srgbToLinear(g), srgbToLinear(b), 1]);
        }
      }
      if (GLOW_IDS.has(source.id)) {
        let best = null;
        for (const { mat, rgba } of mats.values()) {
          const s = saturation(rgba);
          if (!best || s > best.s) best = { mat, s };
        }
        best?.mat.setName(GLOW_NAME);
      }

      const { ratio, error } = source.simplify ?? { ratio: 0.55, error: 0.0008 };
      await doc.transform(
        weld(),
        dedup(),
        simplify({ simplifier: MeshoptSimplifier, ratio, error }),
        prune(),
        quantize(),
        meshopt({ encoder: MeshoptEncoder, level: "medium" }),
      );
      const outPath = join(OUT_DIR, `${source.id}.glb`);
      await io.write(outPath, doc);
      rows.push({ id: source.id, ok: true, triangles, glbKB: Math.round(statSync(outPath).size / 1024), ms: Math.round(performance.now() - t0) });
    } catch (e) {
      rows.push({ id: source.id, ok: false, error: String(e.message || e).slice(0, 120) });
    }
  }

  console.table(rows);
  const failedRows = rows.filter((r) => !r.ok);
  if (failedRows.length) {
    console.error(`${failedRows.length} model(s) failed — leaving modelUrl unset for those in the registry.`);
  }

  const byLicense = new Map();
  for (const s of MODEL_SOURCES) {
    if (!rows.find((r) => r.id === s.id && r.ok)) continue;
    if (!byLicense.has(s.licenseId)) byLicense.set(s.licenseId, []);
    byLicense.get(s.licenseId).push(s);
  }
  const lines = [
    "# Lab 3D model credits",
    "",
    "Generated by `scripts/lab-models/build.mjs` — do not edit by hand.",
    "Simplified/re-exported from the sources below; see src/lab/licenses/ for full license text.",
    "",
  ];
  for (const [licenseId, list] of byLicense) {
    lines.push(`## ${licenseId}`, "");
    for (const s of list) lines.push(`- **${s.id}** — ${s.author}. [Source](${s.sourceUrl})`);
    lines.push("");
  }
  writeFileSync(join(OUT_DIR, "CREDITS.md"), lines.join("\n"));
  console.log(`Wrote ${join(OUT_DIR, "CREDITS.md")}`);
}

main();
