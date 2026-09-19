import { corsJson, corsPreflight } from "@/lib/cors";
import { getSettingsMap } from "@/lib/settings";

export function OPTIONS(req: Request) {
  return corsPreflight(req);
}

export async function GET(req: Request) {
  const settings = await getSettingsMap();
  return corsJson(req, { settings });
}
