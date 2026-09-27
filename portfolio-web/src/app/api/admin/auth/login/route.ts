import { compare } from "bcryptjs";
import { getSession } from "@/lib/auth";
import { corsJson, corsPreflight } from "@/lib/cors";
import { prisma } from "@/lib/db";
import { parseBody } from "@/lib/http";
import {
  clientIp,
  LOGIN_ACCOUNT_RULE,
  LOGIN_IP_RULE,
  rateLimit,
  resetRateLimit,
} from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validate";

export function OPTIONS(req: Request) {
  return corsPreflight(req);
}

function tooManyAttempts(req: Request, retryAfterSec: number) {
  return corsJson(
    req,
    { error: "Too many login attempts. Try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
  );
}

export async function POST(req: Request) {
  const ipCheck = rateLimit(`login:ip:${clientIp(req)}`, LOGIN_IP_RULE);
  if (!ipCheck.ok) return tooManyAttempts(req, ipCheck.retryAfterSec);

  const parsed = await parseBody(req, loginSchema);
  if ("error" in parsed) return parsed.error;

  const email = parsed.data.email.toLowerCase();
  const accountKey = `login:acct:${email}`;
  const accountCheck = rateLimit(accountKey, LOGIN_ACCOUNT_RULE);
  if (!accountCheck.ok) return tooManyAttempts(req, accountCheck.retryAfterSec);

  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user || !(await compare(parsed.data.password, user.passwordHash))) {
    return corsJson(req, { error: "Invalid credentials" }, { status: 401 });
  }
  resetRateLimit(accountKey);

  const session = await getSession();
  session.user = { id: user.id, email: user.email };
  await session.save();

  return corsJson(req, { user: session.user });
}
