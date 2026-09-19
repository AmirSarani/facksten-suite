import { corsJson, corsPreflight } from "@/lib/cors";
import { adminOr401, apiError } from "@/lib/http";
import { MAX_UPLOAD_BYTES, extensionForMime, saveUpload } from "@/lib/upload";

export function OPTIONS(req: Request) {
  return corsPreflight(req);
}

export async function POST(req: Request) {
  const auth = await adminOr401(req);
  if ("error" in auth) {
    return apiError(req, "UNAUTHORIZED", "Unauthorized", 401);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return apiError(req, "INVALID_PAYLOAD", "Expected multipart form data", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return apiError(req, "INVALID_PAYLOAD", "Missing file", 400);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return apiError(req, "PAYLOAD_TOO_LARGE", "File exceeds 5MB", 413);
  }

  const mime = file.type;
  if (!extensionForMime(mime)) {
    return apiError(req, "UNSUPPORTED_TYPE", "Unsupported image type", 415);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const saved = await saveUpload(buffer, mime);
  return corsJson(req, { url: saved.url }, { status: 201 });
}
