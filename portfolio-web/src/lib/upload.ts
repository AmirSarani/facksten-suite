import { randomBytes } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export function extensionForMime(mime: string): string | null {
  return MIME_TO_EXT[mime] ?? null;
}

export function mimeForExtension(ext: string): string | null {
  return EXT_TO_MIME[ext] ?? null;
}

export function createMediaId(ext: string): string {
  return `${randomBytes(16).toString("hex")}.${ext}`;
}

export function isSafeMediaId(id: string): boolean {
  return /^[a-f0-9]{32}\.(jpg|png|webp|gif)$/.test(id);
}

export function mediaUrl(id: string): string {
  return `/api/media/${id}`;
}

export async function saveUpload(buffer: Buffer, mime: string): Promise<{ id: string; url: string }> {
  const ext = extensionForMime(mime);
  if (!ext) {
    throw new Error("UNSUPPORTED_TYPE");
  }
  const id = createMediaId(ext);
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, id), buffer);
  return { id, url: mediaUrl(id) };
}

export async function readUpload(id: string): Promise<{ buffer: Buffer; mime: string } | null> {
  if (!isSafeMediaId(id)) return null;
  const ext = id.split(".").pop() ?? "";
  const mime = mimeForExtension(ext);
  if (!mime) return null;
  try {
    const buffer = await readFile(path.join(UPLOAD_DIR, id));
    return { buffer, mime };
  } catch {
    return null;
  }
}
