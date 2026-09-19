import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request) {
  const admin = await requireUser(["ADMIN"]);
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = z
    .object({
      orderId: z.string(),
      status: z.enum(["PENDING", "PAID", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"]).optional(),
      trackingCode: z.string().optional().nullable(),
      adminNote: z.string().optional().nullable(),
    })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { orderId, status, trackingCode, adminNote } = parsed.data;
  if (status == null && trackingCode === undefined && adminNote === undefined) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      ...(status != null ? { status } : {}),
      ...(trackingCode !== undefined ? { trackingCode: trackingCode?.trim() || null } : {}),
      ...(adminNote !== undefined ? { adminNote: adminNote?.trim() || null } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}
