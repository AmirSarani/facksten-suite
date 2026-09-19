import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireUser } from "@/lib/auth";

const MAX_IMAGE = 2 * 1024 * 1024;
const MAX_DIGITAL = 25 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const DIGITAL_TYPES = new Set([
  "application/zip",
  "application/x-zip-compressed",
  "application/pdf",
  "text/plain",
  "application/json",
  "text/markdown",
  "application/octet-stream",
]);

function digitalExt(file: File) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".zip")) return "zip";
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".txt")) return "txt";
  if (name.endsWith(".ino")) return "ino";
  if (name.endsWith(".json")) return "json";
  if (name.endsWith(".md")) return "md";
  if (file.type === "application/pdf") return "pdf";
  if (file.type.includes("zip")) return "zip";
  return "bin";
}

export async function POST(req: Request) {
  const user = await requireUser(["ADMIN", "PARTNER"]);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "فرم نامعتبر" }, { status: 400 });

  const folderRaw = String(form.get("folder") || "products");
  const folder =
    folderRaw === "articles" ? "articles" : folderRaw === "digital" ? "digital" : "products";

  if (folder === "articles" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "فایل ارسال نشده" }, { status: 400 });
  }

  let ext: string;
  if (folder === "digital") {
    const okType =
      DIGITAL_TYPES.has(file.type) ||
      /\.(zip|pdf|txt|ino|json|md)$/i.test(file.name);
    if (!okType) {
      return NextResponse.json({ error: "فقط ZIP، PDF، TXT، INO، JSON یا MD مجاز است" }, { status: 400 });
    }
    if (file.size > MAX_DIGITAL) {
      return NextResponse.json({ error: "حداکثر حجم فایل دیجیتال ۲۵ مگابایت است" }, { status: 400 });
    }
    ext = digitalExt(file);
  } else {
    if (!IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ error: "فقط JPG، PNG، WEBP یا GIF مجاز است" }, { status: 400 });
    }
    if (file.size > MAX_IMAGE) {
      return NextResponse.json({ error: "حداکثر حجم فایل ۲ مگابایت است" }, { status: 400 });
    }
    ext = IMAGE_EXT[file.type] || "jpg";
  }

  const name = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buffer);

  const url = `/uploads/${folder}/${name}`;
  return NextResponse.json({ url });
}
