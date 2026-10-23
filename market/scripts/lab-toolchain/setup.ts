/**
 * Installs the lab's Arduino compiler: arduino-cli + the official AVR core + a fixed set of
 * libraries — from GitHub only (downloads.arduino.cc is unreachable from the server's network),
 * every download pinned and verified (release checksums, git commit SHAs).
 *
 *   npx tsx scripts/lab-toolchain/setup.ts --dir /opt/pushrsp/lab-toolchain [--avr-gcc /usr | --download-avr-gcc]
 *
 * avr-gcc: by default the one on PATH (Debian/Ubuntu: apt install gcc-avr avr-libc → root /usr).
 * Then start the shop with LAB_TOOLCHAIN_DIR=<dir>; /api/lab/compile switches to arduino-cli.
 * Re-running is safe: finished steps are skipped.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const CLI_VERSION = "1.5.1";
const CLI_SHA256: Record<string, string> = {
  "Linux_64bit.tar.gz": "28a8e119c498a25607821c36cb2dc49e8463941b261a0d99091baa7bc692dd2b",
  "Windows_64bit.zip": "fabe42e0eb04d00e776a66178299ff95a46c623dbc260f997e58fd514853dd40",
};
const CTAGS = "5.8-arduino11";
const CTAGS_SHA512: Record<string, string> = {
  "x86_64-pc-linux-gnu.tar.bz2":
    "043cec9c105ff35ba09824ac1f6d84ae7f2bddeea4afe6c0268394611253633e20bc6206945f773dedc217b87804b0f5066efaf685496a48b32d1775c7e62d36",
  "i686-mingw32.zip":
    "580e1e82aa1ca2b2810cd04f7a6a0d12e4211abf66f57f845bdd946b92919e713d50e7adde3b1a131f046d9cb1642eb33a13507a64d3d4746a4e7c380c15d9a4",
};
const AVR_GCC = { version: "v16.1.0-1", file: "avr-gcc-16.1.0-x64-linux.tar.bz2" };

/** Official AVR core and the libraries sketches may #include (Wire/SPI ship with the core). */
const CORE = { repo: "arduino/ArduinoCore-avr", tag: "1.8.6", sha: "42fa4a1ea1b1b11d1cc0a60298e529d37f9d14bd" };
const LIBRARIES = [
  { name: "Servo", repo: "arduino-libraries/Servo", tag: "1.3.0", sha: "2862ad9864d0dda5669b264857deafbba624940d" },
  { name: "LiquidCrystal", repo: "arduino-libraries/LiquidCrystal", tag: "1.0.7", sha: "a89b4d46b28878557670440f2c35385c19307b69" },
  { name: "Stepper", repo: "arduino-libraries/Stepper", tag: "1.1.3", sha: "cee62bb4de4519f05b68f2a5732cd20e2f324568" },
  { name: "LiquidCrystal_I2C", repo: "johnrickman/LiquidCrystal_I2C", tag: "1.1.3", sha: "9a4e33e6cdaca805d70e220897d0b59446d52adf" },
  { name: "DHT_sensor_library", repo: "adafruit/DHT-sensor-library", tag: "1.4.7", sha: "f7d625462e6033f373e51f8c67f88fc429535b47" },
  { name: "Adafruit_Unified_Sensor", repo: "adafruit/Adafruit_Sensor", tag: "1.1.15", sha: "0a9127a1e886ff1adb4c1b6f5958b24108d55aa6" },
  { name: "Adafruit_BusIO", repo: "adafruit/Adafruit_BusIO", tag: "1.17.4", sha: "3b8364267c3ee6e16bad91bc2101aefbd5b5915f" },
  { name: "Adafruit_GFX_Library", repo: "adafruit/Adafruit-GFX-Library", tag: "1.12.6", sha: "ac6d7c3869a693d406f77b9bfcd486b0673169f0" },
  { name: "Adafruit_SSD1306", repo: "adafruit/Adafruit_SSD1306", tag: "2.5.17", sha: "d94f699451d72286357cba7259055ffff2c2940b" },
];

/** Mirrored by readToolchain() in src/lib/lab-compiler.ts. */
type ToolchainManifest = {
  cli: string;
  config: string;
  avrGccRoot: string;
  ctagsDir: string;
  core: string;
  libraries: { name: string; version: string }[];
};

/** Windows: its own bsdtar (handles zip, and C: paths that GNU tar from Git Bash reads as a host). */
const TAR = process.platform === "win32" ? join(process.env.SystemRoot ?? "C:\Windows", "System32", "tar.exe") : "tar";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function download(url: string, to: string, hash: { algo: "sha256" | "sha512"; hex: string }) {
  if (existsSync(to) && createHash(hash.algo).update(readFileSync(to)).digest("hex") === hash.hex) return;
  console.log(`↓ ${url}`);
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const got = createHash(hash.algo).update(buf).digest("hex");
      if (got !== hash.hex) throw new Error(`checksum mismatch for ${url}: ${got}`);
      writeFileSync(to, buf);
      return;
    } catch (e) {
      if (attempt >= 4 || String(e).includes("checksum")) throw e;
      console.warn(`  retry ${attempt}: ${e}`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

/** Shallow clone of a tag, verified against the pinned commit. */
function cloneAt(repo: string, tag: string, sha: string, to: string) {
  if (existsSync(join(to, ".git"))) {
    const head = execFileSync("git", ["-C", to, "rev-parse", "HEAD"]).toString().trim();
    if (head === sha) return;
    rmSync(to, { recursive: true, force: true });
  }
  console.log(`⎘ ${repo}@${tag}`);
  mkdirSync(dirname(to), { recursive: true });
  execFileSync("git", ["-c", "advice.detachedHead=false", "clone", "--quiet", "--depth", "1", "--branch", tag, `https://github.com/${repo}.git`, to], { stdio: "inherit" });
  const head = execFileSync("git", ["-C", to, "rev-parse", "HEAD"]).toString().trim();
  if (head !== sha) throw new Error(`${repo}@${tag} is ${head}, expected ${sha}`);
}

function which(cmd: string): string | null {
  try {
    const out = execFileSync(process.platform === "win32" ? "where" : "which", [cmd]).toString().split(/\r?\n/)[0].trim();
    return out || null;
  } catch {
    return null;
  }
}

async function main() {
  const dir = resolve(arg("dir") ?? "lab-toolchain");
  const win = process.platform === "win32";
  if (process.arch !== "x64") throw new Error(`unsupported architecture ${process.arch}`);
  const fwd = (p: string) => p.replace(/\\/g, "/");
  mkdirSync(join(dir, "dl"), { recursive: true });

  // arduino-cli
  const cliAsset = win ? "Windows_64bit.zip" : "Linux_64bit.tar.gz";
  const cliArchive = join(dir, "dl", `arduino-cli_${CLI_VERSION}_${cliAsset}`);
  await download(
    `https://github.com/arduino/arduino-cli/releases/download/v${CLI_VERSION}/arduino-cli_${CLI_VERSION}_${cliAsset}`,
    cliArchive,
    { algo: "sha256", hex: CLI_SHA256[cliAsset] },
  );
  mkdirSync(join(dir, "bin"), { recursive: true });
  execFileSync(TAR, ["-xf", cliArchive, "-C", join(dir, "bin")]);
  const cli = join(dir, "bin", win ? "arduino-cli.exe" : "arduino-cli");

  // ctags (arduino-cli uses it to add function prototypes to .ino sketches)
  const ctagsAsset = win ? "i686-mingw32.zip" : "x86_64-pc-linux-gnu.tar.bz2";
  const ctagsArchive = join(dir, "dl", `ctags-${CTAGS}-${ctagsAsset}`);
  await download(`https://github.com/arduino/ctags/releases/download/${CTAGS}/ctags-${CTAGS}-${ctagsAsset}`, ctagsArchive, {
    algo: "sha512",
    hex: CTAGS_SHA512[ctagsAsset],
  });
  const ctagsDir = join(dir, "ctags");
  mkdirSync(ctagsDir, { recursive: true });
  // both archives hold the bare executable at the top level (no folder to strip)
  execFileSync(TAR, ["-xf", ctagsArchive, "-C", ctagsDir]);
  if (!existsSync(join(ctagsDir, win ? "ctags.exe" : "ctags"))) throw new Error(`no ctags executable in ${ctagsDir}`);

  // avr-gcc
  let avrGccRoot = arg("avr-gcc");
  if (process.argv.includes("--download-avr-gcc")) {
    if (win) throw new Error("--download-avr-gcc is for Linux; pass --avr-gcc <root> on Windows");
    const sums = await (await fetch(`https://github.com/ZakKemble/avr-gcc-build/releases/download/${AVR_GCC.version}/SHA256SUMS`)).text();
    const hex = sums.split("\n").find((l) => l.includes(AVR_GCC.file))?.split(/\s+/)[0];
    if (!hex) throw new Error("avr-gcc checksum not found");
    const archive = join(dir, "dl", AVR_GCC.file);
    await download(`https://github.com/ZakKemble/avr-gcc-build/releases/download/${AVR_GCC.version}/${AVR_GCC.file}`, archive, { algo: "sha256", hex });
    mkdirSync(join(dir, "avr-gcc"), { recursive: true });
    execFileSync(TAR, ["-xf", archive, "-C", join(dir, "avr-gcc"), "--strip-components=1"]);
    avrGccRoot = join(dir, "avr-gcc");
  }
  if (!avrGccRoot) {
    const found = which("avr-gcc");
    if (!found) throw new Error("avr-gcc not found on PATH — install gcc-avr + avr-libc, or pass --avr-gcc <root> / --download-avr-gcc");
    avrGccRoot = dirname(dirname(found));
  }
  if (!existsSync(join(avrGccRoot, "bin", win ? "avr-gcc.exe" : "avr-gcc"))) throw new Error(`no bin/avr-gcc under ${avrGccRoot}`);

  // core + libraries
  const user = join(dir, "user");
  cloneAt(CORE.repo, CORE.tag, CORE.sha, join(user, "hardware", "arduino", "avr"));
  for (const lib of LIBRARIES) cloneAt(lib.repo, lib.tag, lib.sha, join(user, "libraries", lib.name));

  // config: no index downloads (empty local indexes), everything inside `dir`
  const data = join(dir, "data");
  mkdirSync(data, { recursive: true });
  writeFileSync(join(data, "package_index.json"), '{"packages":[]}\n');
  writeFileSync(join(data, "library_index.json"), '{"libraries":[]}\n');
  const config = join(dir, "arduino-cli.yaml");
  writeFileSync(
    config,
    [
      "directories:",
      `  data: ${fwd(data)}`,
      `  user: ${fwd(user)}`,
      `  downloads: ${fwd(join(data, "staging"))}`,
      // the compiled core is reused between builds (first build ~15 s, then ~2 s)
      "build_cache:",
      `  path: ${fwd(join(dir, "build-cache"))}`,
      "board_manager:",
      "  additional_urls: []",
      "updater:",
      "  enable_notification: false",
      "",
    ].join("\n"),
  );

  const manifest: ToolchainManifest = {
    cli: fwd(cli),
    config: fwd(config),
    avrGccRoot: fwd(avrGccRoot),
    ctagsDir: fwd(ctagsDir),
    core: `arduino:avr@${CORE.tag}`,
    libraries: LIBRARIES.map((l) => ({ name: l.name, version: l.tag })),
  };
  writeFileSync(join(dir, "toolchain.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`✓ toolchain ready in ${dir}\n  start the shop with LAB_TOOLCHAIN_DIR=${fwd(dir)}`);
}

main().catch((e) => {
  console.error(`✗ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
