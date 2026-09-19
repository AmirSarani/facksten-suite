import { NextResponse } from "next/server";

const DEFAULT_ORIGINS = ["http://localhost:5174"];

function allowedOrigins() {
  const extra = process.env.ADMIN_ORIGIN?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  return new Set([...DEFAULT_ORIGINS, ...extra]);
}

export function applyCors(req: Request, res: NextResponse) {
  const origin = req.headers.get("origin");
  if (origin && allowedOrigins().has(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type");
    res.headers.set("Vary", "Origin");
  }
  return res;
}

export function corsJson(req: Request, data: unknown, init?: ResponseInit) {
  return applyCors(req, NextResponse.json(data, init));
}

export function corsPreflight(req: Request) {
  return applyCors(req, new NextResponse(null, { status: 204 }));
}
