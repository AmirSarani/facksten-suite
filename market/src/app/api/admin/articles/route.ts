import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugifyContent } from "@/lib/panel";

const articleSchema = z.object({
  title: z.string().min(3),
  excerpt: z.string().min(3),
  category: z.string().min(2),
  body: z.string().optional(),
  slug: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  published: z.boolean().optional(),
  dateLabel: z.string().optional().nullable(),
});

async function uniqueSlug(base: string, excludeId?: string) {
  let slug = slugifyContent(base, "article");
  let n = 0;
  while (true) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const found = await prisma.article.findUnique({ where: { slug: candidate } });
    if (!found || found.id === excludeId) return candidate;
    n += 1;
  }
}

export async function POST(req: Request) {
  const user = await requireUser(["ADMIN"]);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = articleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "داده‌های مقاله نامعتبر است" }, { status: 400 });

  const slug = await uniqueSlug(parsed.data.slug || parsed.data.title);
  const article = await prisma.article.create({
    data: {
      title: parsed.data.title,
      excerpt: parsed.data.excerpt,
      category: parsed.data.category,
      body: parsed.data.body ?? "",
      slug,
      dateLabel: parsed.data.dateLabel || new Date().toLocaleDateString("fa-IR"),
      image: parsed.data.image || "",
      published: parsed.data.published ?? true,
    },
  });
  return NextResponse.json({ article });
}

export async function PATCH(req: Request) {
  const user = await requireUser(["ADMIN"]);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const id = body?.id as string | undefined;
  if (!id) return NextResponse.json({ error: "id لازم است" }, { status: 400 });

  const parsed = articleSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "داده‌های مقاله نامعتبر است" }, { status: 400 });

  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const data = parsed.data;
  let slug = existing.slug;
  if (data.slug || data.title) {
    slug = await uniqueSlug(data.slug || data.title || existing.title, existing.id);
  }

  const article = await prisma.article.update({
    where: { id },
    data: {
      ...(data.title != null ? { title: data.title } : {}),
      ...(data.excerpt != null ? { excerpt: data.excerpt } : {}),
      ...(data.category != null ? { category: data.category } : {}),
      ...(data.body != null ? { body: data.body } : {}),
      ...(data.image !== undefined ? { image: data.image || "" } : {}),
      ...(data.published != null ? { published: data.published } : {}),
      ...(data.dateLabel !== undefined ? { dateLabel: data.dateLabel || existing.dateLabel } : {}),
      slug,
    },
  });
  return NextResponse.json({ article });
}

export async function DELETE(req: Request) {
  const user = await requireUser(["ADMIN"]);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = z.object({ id: z.string().min(1) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "داده‌های مقاله نامعتبر است" }, { status: 400 });
  await prisma.article.delete({ where: { id: parsed.data.id } });
  return NextResponse.json({ ok: true });
}
