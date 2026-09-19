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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await adminOr401(req);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const item = await prisma.project.findUnique({ where: { id }, include });
  if (!item) return corsJson(req, { error: "Not found" }, { status: 404 });
  return corsJson(req, { item });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await adminOr401(req);
  if ("error" in auth) return auth.error;
  const parsed = await parseBody(req, projectSchema.partial());
  if ("error" in parsed) return parsed.error;
  const { id } = await params;
  const { media, collaborators, ...data } = parsed.data;
  try {
    const item = await prisma.$transaction(async (tx) => {
      if (media) {
        await tx.projectMedia.deleteMany({ where: { projectId: id } });
      }
      if (collaborators) {
        await tx.projectCollaborator.deleteMany({ where: { projectId: id } });
      }
      return tx.project.update({
        where: { id },
        data: {
          ...data,
          media: media ? { create: media } : undefined,
          collaborators: collaborators ? { create: collaborators } : undefined,
        },
        include,
      });
    });
    return corsJson(req, { item });
  } catch {
    return corsJson(req, { error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await adminOr401(req);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    await prisma.project.delete({ where: { id } });
    return corsJson(req, { ok: true });
  } catch {
    return corsJson(req, { error: "Not found" }, { status: 404 });
  }
}
