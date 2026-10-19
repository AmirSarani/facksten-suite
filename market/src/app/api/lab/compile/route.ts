import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { compileSketch } from "@/lib/lab-compiler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  code: z.string().min(1).max(80_000),
  board: z.enum(["uno", "nano"]).default("uno"),
});

const COMPILE_RULE = { limit: 10, windowMs: 60_000 };
const MAX_CONCURRENT_COMPILES = 2;
let activeCompiles = 0;

/**
 * Compile a sketch for the lab simulator (see src/lib/lab-compiler.ts for the backends).
 * Unsupported libraries return a clear Persian error — never fake success.
 */
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "برای کامپایل باید وارد حساب شوید" }, { status: 401 });
  }

  const limited = rateLimit(`compile:${user.id}`, COMPILE_RULE);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "درخواست کامپایل بیش از حد مجاز است. کمی صبر کنید." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  if (activeCompiles >= MAX_CONCURRENT_COMPILES) {
    return NextResponse.json(
      { error: "سرور در حال کامپایل است. چند ثانیه بعد دوباره امتحان کنید." },
      { status: 503, headers: { "Retry-After": "5" } },
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "درخواست نامعتبر" }, { status: 400 });
  }

  const { code, board } = parsed.data;

  activeCompiles += 1;
  try {
    const result = await compileSketch(code, board);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, detail: result.detail, diagnostics: result.diagnostics, backend: result.backend },
        { status: result.status },
      );
    }
    return NextResponse.json({
      ok: true,
      board,
      hex: result.hex,
      backend: result.backend,
      cached: result.cached,
      flashBytes: result.flashBytes,
      warnings: result.warnings,
      note: result.backend === "arduino-cli" ? "کامپایل با arduino-cli و هسته‌ی رسمی Arduino" : "کامپایل با avr-gcc و هسته‌ی ساده‌ی آزمایشگاه",
    });
  } finally {
    activeCompiles -= 1;
  }
}
