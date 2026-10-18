/**
 * Compile the simulator test sketches (src/lab/engine/__fixtures__/*.ino) to Intel HEX with the
 * lab shim, exactly as /api/lab/compile does. The .hex files are committed so the tests run
 * without avr-gcc; re-run this after changing the shim:
 *
 *   npx tsx scripts/lab-build-fixtures.ts      (needs avr-gcc + avr-objcopy on PATH)
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const dir = join(root, "src", "lab", "engine", "__fixtures__");
const shim = join(root, "scripts", "lab-shim");
const tmp = mkdtempSync(join(tmpdir(), "lab-fixtures-"));

try {
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".ino"))) {
    const name = file.replace(/\.ino$/, "");
    const src = join(tmp, `${name}.cpp`);
    const elf = join(tmp, `${name}.elf`);
    const sketch = `#include <Arduino.h>\n${readFileSync(join(dir, file), "utf8")}\n\nint main(void) {\n  __lab_init();\n  setup();\n  for(;;) { loop(); }\n  return 0;\n}\n`;
    writeFileSync(src, sketch);
    execFileSync("avr-gcc", ["-mmcu=atmega328p", "-DF_CPU=16000000UL", "-Os", "-std=gnu++17", `-I${shim}`, "-lm", "-o", elf, src], { stdio: "inherit" });
    execFileSync("avr-objcopy", ["-O", "ihex", "-R", ".eeprom", elf, join(dir, `${name}.hex`)]);
    console.log(`built ${name}.hex`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
