import { corsJson, corsPreflight } from "@/lib/cors";
import { prisma } from "@/lib/db";
import { adminOr401, parseBody } from "@/lib/http";
import { projectSchema } from "@/lib/validate";

const include = {
  media: { orderBy: { sortOrder: "asc" as const } },
  collaborators: { orderBy: { sortOrder: "asc" as const } },
};

export function OPTIONS(req: Request) {
  return corsPreflight(req);
}

export async function GET(req: Request) {
  const auth = await adminOr401(req);
  if ("error" in auth) return auth.error;
  const items = await prisma.project.findMany({
    include,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return corsJson(req, { items });
}

export async function POST(req: Request) {
  const auth = await adminOr401(req);
  if ("error" in auth) return auth.error;
  const parsed = await parseBody(req, projectSchema);
  if ("error" in parsed) return parsed.error;
  const { media, collaborators, ...data } = parsed.data;
  const item = await prisma.project.create({
    data: {
      ...data,
      media: media ? { create: media } : undefined,
      collaborators: collaborators ? { create: collaborators } : undefined,
    },
    include,
  });
  return corsJson(req, { item }, { status: 201 });
}
