import { NextResponse } from "next/server";
import { z } from "zod";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  code: z.string().min(1).max(80_000),
  board: z.enum(["uno", "nano"]).default("uno"),
});

const SHIM_DIR = join(process.cwd(), "scripts", "lab-shim");

/**
 * Compile Arduino-like sketch with avr-gcc (server-side).
 * Unsupported libraries return a clear Persian error — never fake success.
 */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "درخواست نامعتبر" }, { status: 400 });
  }

  const { code, board } = parsed.data;

  // Reject known-unsupported heavy libs early with honesty
  if (/#\s*include\s*<Wire\.h>/.test(code) || /#\s*include\s*<LiquidCrystal/.test(code)) {
    return NextResponse.json(
      {
        error:
          "کتابخانه درخواستی در MVP پشتیبانی نمی‌شود. قالب‌های Blink/LED/دکمه را امتحان کنید یا Servo ساده.",
      },
      { status: 422 },
    );
  }

  const dir = await mkdtemp(join(tmpdir(), "facksten-lab-"));
  try {
    let sketch = code;
    // Wrap Arduino-style sketch into main() if needed
    if (!/\bint\s+main\s*\(/.test(sketch)) {
      if (!/#\s*include\s*[<"]Arduino\.h[>"]/.test(sketch)) {
        sketch = `#include <Arduino.h>\n${sketch}`;
      }
      sketch += `\n\nint main(void) {\n  init();\n  setup();\n  for(;;) { loop(); }\n  return 0;\n}\n`;
      // Provide empty init if not present
      if (!/\bvoid\s+init\s*\(/.test(sketch)) {
        sketch = sketch.replace(
          "#include <Arduino.h>",
          `#include <Arduino.h>\nstatic void init(void) { sei(); }\n`,
        );
      }
    }

    const srcPath = join(dir, "sketch.cpp");
    await writeFile(srcPath, sketch, "utf8");

    const elf = join(dir, "sketch.elf");
    const hex = join(dir, "sketch.hex");
    const mcu = "atmega328p";

    try {
      await execFileAsync(
        "avr-gcc",
        [
          `-mmcu=${mcu}`,
          "-DF_CPU=16000000UL",
          "-Os",
          "-std=gnu++17",
          `-I${SHIM_DIR}`,
          "-lm",
          "-o",
          elf,
          srcPath,
        ],
        { timeout: 20_000, maxBuffer: 2_000_000 },
      );
    } catch (e) {
      const err = e as { stderr?: string; message?: string };
      const detail = (err.stderr || err.message || "خطای کامپایل").slice(0, 4000);
      return NextResponse.json(
        { error: "کامپایل ناموفق", detail },
        { status: 422 },
      );
    }

    await execFileAsync("avr-objcopy", ["-O", "ihex", "-R", ".eeprom", elf, hex], {
      timeout: 10_000,
    });
    const hexText = await readFile(hex, "utf8");
    return NextResponse.json({
      ok: true,
      board,
      hex: hexText,
      note: "کامپایل با avr-gcc روی سرور — خروجی واقعی برای avr8js",
    });
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}
