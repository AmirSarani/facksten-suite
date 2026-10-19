import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

/**
 * Compiles lab sketches to Intel HEX for the simulator.
 *  - arduino-cli + the official AVR core + real libraries, when LAB_TOOLCHAIN_DIR points at a
 *    toolchain made by scripts/lab-toolchain/setup.ts;
 *  - otherwise plain avr-gcc with the small core in scripts/lab-shim/ (no libraries but Servo).
 * Results are cached by (backend, board, code); errors come back with sketch line numbers.
 */

const execFileAsync = promisify(execFile);

export type Board = "uno" | "nano";
export type CompileDiagnostic = { line: number; column: number; severity: "error" | "warning"; message: string };
export type CompileResult =
  | { ok: true; hex: string; backend: Backend; cached: boolean; flashBytes: number | null; warnings: CompileDiagnostic[] }
  | { ok: false; status: number; error: string; detail?: string; backend: Backend; diagnostics: CompileDiagnostic[] };
type Backend = "arduino-cli" | "shim";

type Toolchain = {
  dir: string;
  cli: string;
  config: string;
  avrGccRoot: string;
  ctagsDir: string;
  core: string;
  libraries: { name: string; version: string }[];
};

const FQBN: Record<Board, string> = { uno: "arduino:avr:uno", nano: "arduino:avr:nano:cpu=atmega328" };
const SHIM_DIR = join(process.cwd(), "scripts", "lab-shim");
const CLI_TIMEOUT_MS = 90_000;
const SHIM_TIMEOUT_MS = 20_000;

let toolchainCache: { dir: string; value: Toolchain | null } | null = null;

/** The arduino-cli toolchain from LAB_TOOLCHAIN_DIR, or null when not configured. */
export function readToolchain(): Toolchain | null {
  const dir = process.env.LAB_TOOLCHAIN_DIR?.trim();
  if (!dir) return null;
  if (toolchainCache?.dir === dir) return toolchainCache.value;
  let value: Toolchain | null = null;
  try {
    const manifest = JSON.parse(readFileSync(join(dir, "toolchain.json"), "utf8")) as Omit<Toolchain, "dir">;
    if (existsSync(manifest.cli)) value = { dir, ...manifest };
  } catch {
    value = null;
  }
  toolchainCache = { dir, value };
  return value;
}

/** Libraries sketches can #include with the current backend (Wire/SPI come with the core). */
export function availableLibraries(): string[] {
  const t = readToolchain();
  return t ? ["Wire", "SPI", "EEPROM", "SoftwareSerial", ...t.libraries.map((l) => l.name)] : ["Servo"];
}

// ---------------------------------------------------------------------------------------------
// Safety: the sketch runs through the compiler on our server, so it must not be able to read
// files into the firmware (#include of arbitrary paths, assembler .incbin/.include).

/** Only bare header names (e.g. <avr/io.h>, "Arduino.h"); no traversal or absolute paths. */
export function hasUnsafeInclude(code: string): boolean {
  const includes = code.matchAll(/^\s*#\s*(?:include|include_next|import)\s*[<"]([^>"\n]*)[>"]?/gm);
  for (const match of includes) {
    const target = match[1].trim();
    if (target.includes("..") || target.startsWith("/") || target.includes("\\") || /^[a-zA-Z]:/.test(target)) return true;
  }
  return /^\s*#\s*(?:include|include_next|import)\s+(?![<"])/m.test(code);
}

/** Assembler directives that pull a file's bytes into the output. */
export function hasFileEmbedding(code: string): boolean {
  return /\.\s*(incbin|include)\b/i.test(code) || /__has_include_next|#\s*embed\b/.test(code);
}

// ---------------------------------------------------------------------------------------------

const resultCache = new Map<string, Extract<CompileResult, { ok: true }>>();
const CACHE_MAX = 200;

function remember(key: string, result: Extract<CompileResult, { ok: true }>) {
  resultCache.delete(key);
  resultCache.set(key, result);
  while (resultCache.size > CACHE_MAX) resultCache.delete(resultCache.keys().next().value!);
}

/** gcc diagnostics for the sketch file, mapped back to the user's lines. */
export function parseDiagnostics(output: string, file: RegExp, lineOffset = 0): CompileDiagnostic[] {
  const out: CompileDiagnostic[] = [];
  const seen = new Set<string>();
  for (const raw of output.split(/\r?\n/)) {
    const m = new RegExp(`(?:^|[\\\\/])${file.source}:(\\d+):(\\d+):\\s*(fatal error|error|warning):\\s*(.*)$`).exec(raw);
    if (!m) continue;
    const line = Math.max(1, Number(m[1]) - lineOffset);
    const d: CompileDiagnostic = { line, column: Number(m[2]), severity: m[3] === "warning" ? "warning" : "error", message: m[4].trim() };
    const key = `${d.line}:${d.column}:${d.message}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(d);
    }
  }
  return out;
}

/** A missing header usually means a library we don't have; say which ones we do. */
function friendlyError(diagnostics: CompileDiagnostic[]): string {
  const missing = diagnostics.find((d) => /No such file or directory/.test(d.message));
  if (missing) {
    const header = /([\w./-]+\.h)/.exec(missing.message)?.[1] ?? "کتابخانه";
    return `«${header}» پیدا نشد. کتابخانه‌های موجود: ${availableLibraries().join("، ")}`;
  }
  const first = diagnostics.find((d) => d.severity === "error");
  return first ? `خطای کامپایل در خط ${first.line.toLocaleString("fa-IR")}: ${first.message}` : "کامپایل ناموفق";
}

export async function compileSketch(code: string, board: Board): Promise<CompileResult> {
  const toolchain = readToolchain();
  const backend: Backend = toolchain ? "arduino-cli" : "shim";
  if (hasUnsafeInclude(code)) return { ok: false, status: 422, error: "مسیر #include نامعتبر است", backend, diagnostics: [] };
  if (hasFileEmbedding(code)) return { ok: false, status: 422, error: "دستورهای جاسازی فایل (.incbin / .include) مجاز نیستند", backend, diagnostics: [] };

  const key = createHash("sha256")
    .update(`${backend}|${toolchain ? `${toolchain.core}|${toolchain.libraries.map((l) => `${l.name}@${l.version}`).join(",")}` : "shim"}|${board}|${code}`)
    .digest("hex");
  const hit = resultCache.get(key);
  if (hit) {
    remember(key, hit);
    return { ...hit, cached: true };
  }

  const result = toolchain ? await compileWithArduinoCli(toolchain, code, board) : await compileWithShim(code);
  if (result.ok) remember(key, result);
  return result;
}

async function compileWithArduinoCli(t: Toolchain, code: string, board: Board): Promise<CompileResult> {
  const dir = await mkdtemp(join(tmpdir(), "pushrsp-lab-"));
  try {
    const sketchDir = join(dir, "sketch");
    await mkdir(sketchDir);
    await writeFile(join(sketchDir, "sketch.ino"), code, "utf8");
    const out = join(dir, "out");
    let output = "";
    try {
      const res = await execFileAsync(
        t.cli,
        [
          "--config-file", t.config,
          "--no-color",
          "compile",
          "--fqbn", FQBN[board],
          "--build-property", `runtime.tools.avr-gcc.path=${t.avrGccRoot}`,
          "--build-property", `runtime.tools.ctags.path=${t.ctagsDir}`,
          "--build-path", join(dir, "build"),
          "--output-dir", out,
          "--warnings", "default",
          sketchDir,
        ],
        { timeout: CLI_TIMEOUT_MS, maxBuffer: 4_000_000, env: minimalEnv() },
      );
      output = `${res.stdout}\n${res.stderr}`;
    } catch (e) {
      const err = e as { stdout?: string; stderr?: string; killed?: boolean; message?: string };
      if (err.killed) return { ok: false, status: 504, error: "کامپایل بیش از حد طول کشید.", backend: "arduino-cli", diagnostics: [] };
      const text = `${err.stdout ?? ""}\n${err.stderr ?? err.message ?? ""}`;
      const diagnostics = parseDiagnostics(text, /sketch\.ino/);
      return { ok: false, status: 422, error: friendlyError(diagnostics), detail: cleanLog(text), backend: "arduino-cli", diagnostics };
    }
    const hex = await readFile(join(out, "sketch.ino.hex"), "utf8");
    const flash = /Sketch uses (\d+) bytes/.exec(output);
    return {
      ok: true,
      hex,
      backend: "arduino-cli",
      cached: false,
      flashBytes: flash ? Number(flash[1]) : null,
      warnings: parseDiagnostics(output, /sketch\.ino/).filter((d) => d.severity === "warning"),
    };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function compileWithShim(code: string): Promise<CompileResult> {
  if (/#\s*include\s*<(Wire|LiquidCrystal|Adafruit|DHT|SPI)/.test(code)) {
    return {
      ok: false,
      status: 422,
      error: "این کتابخانه روی این سرور نصب نیست (کامپایلر کامل Arduino راه‌اندازی نشده). فعلاً فقط Servo در دسترس است.",
      backend: "shim",
      diagnostics: [],
    };
  }
  const dir = await mkdtemp(join(tmpdir(), "pushrsp-lab-"));
  try {
    let sketch = code;
    let offset = 0;
    if (!/\bint\s+main\s*\(/.test(sketch)) {
      if (!/#\s*include\s*[<"]Arduino\.h[>"]/.test(sketch)) {
        sketch = `#include <Arduino.h>\n${sketch}`;
        offset = 1;
      }
      // __lab_init() (scripts/lab-shim/Arduino.h) sets up timers, PWM and the ADC like the real core
      sketch += `\n\nint main(void) {\n  __lab_init();\n  setup();\n  for(;;) { loop(); }\n  return 0;\n}\n`;
    }
    const src = join(dir, "sketch.cpp");
    const elf = join(dir, "sketch.elf");
    const hex = join(dir, "sketch.hex");
    await writeFile(src, sketch, "utf8");
    try {
      await execFileAsync(
        "avr-gcc",
        ["-mmcu=atmega328p", "-DF_CPU=16000000UL", "-Os", "-std=gnu++17", `-I${SHIM_DIR}`, "-lm", "-o", elf, src],
        { timeout: SHIM_TIMEOUT_MS, maxBuffer: 2_000_000, env: minimalEnv() },
      );
    } catch (e) {
      const err = e as { stderr?: string; message?: string; killed?: boolean };
      if (err.killed) return { ok: false, status: 504, error: "کامپایل بیش از حد طول کشید.", backend: "shim", diagnostics: [] };
      const text = err.stderr || err.message || "";
      const diagnostics = parseDiagnostics(text, /sketch\.cpp/, offset);
      return { ok: false, status: 422, error: friendlyError(diagnostics), detail: cleanLog(text), backend: "shim", diagnostics };
    }
    await execFileAsync("avr-objcopy", ["-O", "ihex", "-R", ".eeprom", elf, hex], { timeout: 10_000, env: minimalEnv() });
    return { ok: true, hex: await readFile(hex, "utf8"), backend: "shim", cached: false, flashBytes: null, warnings: [] };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

/** Compiler output without our temp paths. */
function cleanLog(text: string): string {
  return text
    .replace(/[A-Za-z]:[\\/][^\s:]*?[\\/](sketch\.(?:ino|cpp))/g, "$1")
    .replace(/\/tmp\/[^\s:]*?\/(sketch\.(?:ino|cpp))/g, "$1")
    .slice(0, 4000);
}

/** The compiler gets no secrets from the server's environment. */
function minimalEnv(): NodeJS.ProcessEnv {
  const keep = ["PATH", "Path", "SystemRoot", "TEMP", "TMP", "TMPDIR", "HOME", "USERPROFILE", "LOCALAPPDATA", "APPDATA"];
  const env = Object.fromEntries(keep.filter((k) => process.env[k]).map((k) => [k, process.env[k]!]));
  return { ...env, NODE_ENV: process.env.NODE_ENV ?? "production" };
}
