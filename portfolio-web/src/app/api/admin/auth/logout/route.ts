import { getSession } from "@/lib/auth";
import { corsJson, corsPreflight } from "@/lib/cors";

export function OPTIONS(req: Request) {
  return corsPreflight(req);
}

export async function POST(req: Request) {
  const session = await getSession();
  session.destroy();
  return corsJson(req, { ok: true });
}
