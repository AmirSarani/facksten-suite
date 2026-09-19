import { getSession } from "@/lib/auth";
import { corsJson, corsPreflight } from "@/lib/cors";

export function OPTIONS(req: Request) {
  return corsPreflight(req);
}

export async function GET(req: Request) {
  const session = await getSession();
  return corsJson(req, { user: session.user ?? null });
}
