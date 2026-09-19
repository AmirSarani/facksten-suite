import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const homeSchema = z.object({
  heroTitle: z.string(),
  heroSubtitle: z.string(),
  heroCtaLabel: z.string(),
  heroCtaHref: z.string(),
  stripCategorySlugs: z.array(z.string()),
  showDeals: z.boolean(),
  showPopular: z.boolean(),
  showNew: z.boolean(),
  showDigital: z.boolean(),
});

export async function PATCH(req: Request) {
  const user = await requireUser(["ADMIN"]);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = z
    .object({
      phone: z.string(),
      email: z.string(),
      address: z.string(),
      faq: z.array(z.object({ q: z.string(), a: z.string() })),
      home: homeSchema.optional(),
    })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "داده‌های ارسالی نامعتبر است" }, { status: 400 });

  const homeJson = parsed.data.home ? JSON.stringify(parsed.data.home) : undefined;

  await prisma.siteSetting.upsert({
    where: { id: "main" },
    create: {
      id: "main",
      phone: parsed.data.phone,
      email: parsed.data.email,
      address: parsed.data.address,
      faqJson: JSON.stringify(parsed.data.faq),
      homeJson: homeJson ?? "{}",
    },
    update: {
      phone: parsed.data.phone,
      email: parsed.data.email,
      address: parsed.data.address,
      faqJson: JSON.stringify(parsed.data.faq),
      ...(homeJson != null ? { homeJson } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}
