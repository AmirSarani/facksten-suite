import { corsJson, corsPreflight } from "@/lib/cors";
import { prisma } from "@/lib/db";
import { parseBody } from "@/lib/http";
import { leadSchema } from "@/lib/validate";

export function OPTIONS(req: Request) {
  return corsPreflight(req);
}

export async function POST(req: Request) {
  const parsed = await parseBody(req, leadSchema);
  if ("error" in parsed) return parsed.error;

  const lead = await prisma.lead.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      message: parsed.data.message,
      locale: parsed.data.locale ?? "fa",
    },
  });

  return corsJson(req, { ok: true, id: lead.id }, { status: 201 });
}
