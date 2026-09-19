import path from "path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function resolveDbFile() {
  const fromEnv = process.env.DATABASE_URL?.replace(/^file:/, "").trim();
  const file = fromEnv && fromEnv.length > 0 ? fromEnv : "dev.db";
  return path.isAbsolute(file) ? file : path.join(/*turbopackIgnore: true*/ process.cwd(), file);
}

function createClient() {
  const url = `file:${resolveDbFile()}`;
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
