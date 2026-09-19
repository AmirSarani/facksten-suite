import { readFile, stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ folder: string; name: string }> };

const ALLOWED_FOLDERS = new Set(["products", "articles"]);
const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(_req: Request, ctx: Ctx) {
  const { folder, name } = await ctx.params;
  if (!ALLOWED_FOLDERS.has(folder)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(name) || name.includes("..")) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const ext = path.extname(name).toLowerCase();
  const mime = MIME[ext];
  if (!mime) return NextResponse.json({ error: "not found" }, { status: 404 });

  const filePath = path.join(process.cwd(), "public", "uploads", folder, name);
  try {
    const s = await stat(filePath);
    if (!s.isFile()) return NextResponse.json({ error: "not found" }, { status: 404 });
    const buf = await readFile(filePath);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": mime,
        "Content-Length": String(buf.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
