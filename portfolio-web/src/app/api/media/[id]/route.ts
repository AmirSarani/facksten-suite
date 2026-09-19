import { NextResponse } from "next/server";
import { applyCors, corsPreflight } from "@/lib/cors";
import { apiError } from "@/lib/http";
import { readUpload } from "@/lib/upload";

export function OPTIONS(req: Request) {
  return corsPreflight(req);
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const file = await readUpload(id);
  if (!file) {
    return apiError(req, "NOT_FOUND", "Not found", 404);
  }
  return applyCors(
    req,
    new NextResponse(Uint8Array.from(file.buffer), {
      headers: {
        "Content-Type": file.mime,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    }),
  );
}
