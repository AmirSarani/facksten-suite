import { compare } from "bcryptjs";
import { getSession } from "@/lib/auth";
import { corsJson, corsPreflight } from "@/lib/cors";
import { prisma } from "@/lib/db";
import { parseBody } from "@/lib/http";
import { loginSchema } from "@/lib/validate";

export function OPTIONS(req: Request) {
  return corsPreflight(req);
}

export async function POST(req: Request) {
  const parsed = await parseBody(req, loginSchema);
  if ("error" in parsed) return parsed.error;

  const user = await prisma.adminUser.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!user || !(await compare(parsed.data.password, user.passwordHash))) {
    return corsJson(req, { error: "Invalid credentials" }, { status: 401 });
  }

  const session = await getSession();
  session.user = { id: user.id, email: user.email };
  await session.save();

  return corsJson(req, { user: session.user });
}
