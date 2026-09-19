import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";
import { requireUser } from "@/lib/auth";

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

async function listImages(absDir: string, urlPrefix: string) {
  try {
    const entries = await readdir(absDir);
    const out: { url: string; name: string; mtime: number }[] = [];
    for (const name of entries) {
      const ext = path.extname(name).toLowerCase();
      if (!IMAGE_EXT.has(ext)) continue;
      const full = path.join(absDir, name);
      const s = await stat(full).catch(() => null);
      if (!s?.isFile()) continue;
      out.push({ url: `${urlPrefix}/${name}`.replace(/\\/g, "/"), name, mtime: s.mtimeMs });
    }
    return out;
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const user = await requireUser(["ADMIN", "PARTNER"]);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder") || "all";

  const publicRoot = path.join(process.cwd(), "public");
  const items: { url: string; name: string; mtime: number }[] = [];

  if (folder === "products" || folder === "all") {
    items.push(...(await listImages(path.join(publicRoot, "uploads", "products"), "/uploads/products")));
    items.push(...(await listImages(path.join(publicRoot, "images", "products"), "/images/products")));
  }
  if (folder === "articles" || folder === "all") {
    if (user.role === "ADMIN" || folder === "all") {
      items.push(...(await listImages(path.join(publicRoot, "uploads", "articles"), "/uploads/articles")));
      items.push(...(await listImages(path.join(publicRoot, "images", "articles"), "/images/articles")));
    }
  }

  items.sort((a, b) => b.mtime - a.mtime);
  return NextResponse.json({ items: items.slice(0, 120) });
}
