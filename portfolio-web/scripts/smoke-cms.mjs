#!/usr/bin/env node
/**
 * Smoke the Phase 1 CMS contract plus legal + upload.
 * Usage: node scripts/smoke-cms.mjs [baseUrl]
 */
const BASE = process.argv[2] ?? "http://localhost:3020";

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  const mark = ok ? "PASS" : "FAIL";
  console.log(`${mark}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function req(path, init = {}) {
  const headers = new Headers(init.headers ?? {});
  if (init.json !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
    redirect: "manual",
  });
  const text = await res.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* keep text */
  }
  return { res, body, text };
}

function cookieHeader(setCookie) {
  return setCookie
    .map((c) => c.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

async function main() {
  const servicesFa = await req("/api/public/services");
  record(
    "GET /api/public/services (default fa)",
    servicesFa.res.ok &&
      servicesFa.body?.locale === "fa" &&
      Array.isArray(servicesFa.body?.items) &&
      servicesFa.body.items.every((s) => s.title) &&
      !servicesFa.body.items.some((s) => s.slug === "studio-consulting"),
    `status=${servicesFa.res.status} count=${servicesFa.body?.items?.length ?? "?"}`,
  );

  const servicesEn = await req("/api/public/services?locale=en");
  record(
    "GET /api/public/services?locale=en",
    servicesEn.res.ok && servicesEn.body?.locale === "en" && servicesEn.body.items?.length === servicesFa.body.items?.length,
    `status=${servicesEn.res.status}`,
  );

  const projects = await req("/api/public/projects?locale=fa");
  record(
    "GET /api/public/projects",
    projects.res.ok &&
      Array.isArray(projects.body?.items) &&
      !projects.body.items.some((p) => p.slug === "signal-bench"),
    `status=${projects.res.status} count=${projects.body?.items?.length ?? "?"}`,
  );

  const project = await req("/api/public/projects/pulse-rack?locale=en");
  record(
    "GET /api/public/projects/:slug",
    project.res.ok && project.body?.item?.slug === "pulse-rack" && project.body?.locale === "en",
    `status=${project.res.status}`,
  );

  const draftProject = await req("/api/public/projects/signal-bench");
  record(
    "GET /api/public/projects/signal-bench (draft hidden)",
    draftProject.res.status === 404,
    `status=${draftProject.res.status}`,
  );

  const team = await req("/api/public/team?locale=en");
  record(
    "GET /api/public/team",
    team.res.ok && Array.isArray(team.body?.items) && team.body.items.length >= 1,
    `status=${team.res.status} count=${team.body?.items?.length ?? "?"}`,
  );

  const settings = await req("/api/public/settings");
  record(
    "GET /api/public/settings",
    settings.res.ok && settings.body?.settings?.legal?.privacy?.fa,
    `status=${settings.res.status}`,
  );

  const lead = await req("/api/public/leads", {
    method: "POST",
    json: { name: "Smoke Tester", email: "smoke@example.com", message: "Phase 1 smoke", locale: "en" },
  });
  record("POST /api/public/leads", lead.res.status === 201 && lead.body?.ok === true, `status=${lead.res.status}`);

  const privacyFa = await req("/api/public/legal/privacy");
  record(
    "GET /api/public/legal/privacy (default fa)",
    privacyFa.res.ok && privacyFa.body?.page === "privacy" && privacyFa.body?.locale === "fa" && privacyFa.body?.body,
    `status=${privacyFa.res.status}`,
  );

  const termsEn = await req("/api/public/legal/terms?locale=en");
  record(
    "GET /api/public/legal/terms?locale=en",
    termsEn.res.ok && termsEn.body?.page === "terms" && termsEn.body?.locale === "en" && termsEn.body?.body,
    `status=${termsEn.res.status}`,
  );

  const legalBad = await req("/api/public/legal/cookies");
  record(
    "GET /api/public/legal/cookies (404)",
    legalBad.res.status === 404 && legalBad.body?.error?.code === "NOT_FOUND",
    `status=${legalBad.res.status}`,
  );

  const unauthMe = await req("/api/admin/auth/me");
  record("GET /api/admin/auth/me (anon)", unauthMe.res.ok && unauthMe.body?.user === null, `status=${unauthMe.res.status}`);

  const unauthUpload = await req("/api/admin/upload", { method: "POST", body: new FormData() });
  record(
    "POST /api/admin/upload (anon 401)",
    unauthUpload.res.status === 401 && unauthUpload.body?.error?.code === "UNAUTHORIZED",
    `status=${unauthUpload.res.status}`,
  );

  const unauthLegal = await req("/api/admin/legal");
  record(
    "GET /api/admin/legal (anon 401)",
    unauthLegal.res.status === 401 && unauthLegal.body?.error?.code === "UNAUTHORIZED",
    `status=${unauthLegal.res.status}`,
  );

  const unauthLeads = await req("/api/admin/leads");
  record("GET /api/admin/leads (anon 401)", unauthLeads.res.status === 401, `status=${unauthLeads.res.status}`);

  const badLogin = await req("/api/admin/auth/login", {
    method: "POST",
    json: { email: "admin@facksten.local", password: "wrong-password" },
  });
  record("POST /api/admin/auth/login (bad password)", badLogin.res.status === 401, `status=${badLogin.res.status}`);

  const login = await req("/api/admin/auth/login", {
    method: "POST",
    json: { email: "admin@facksten.local", password: "ChangeMe123!" },
  });
  const cookie = cookieHeader(login.res.headers.getSetCookie?.() ?? []);
  record(
    "POST /api/admin/auth/login",
    login.res.ok && login.body?.user?.email === "admin@facksten.local" && cookie.includes("facksten_portfolio_admin"),
    `status=${login.res.status}`,
  );

  const auth = { headers: { Cookie: cookie } };

  const me = await req("/api/admin/auth/me", auth);
  record(
    "GET /api/admin/auth/me (session)",
    me.res.ok && me.body?.user?.email === "admin@facksten.local",
    `status=${me.res.status}`,
  );

  const adminLeads = await req("/api/admin/leads", auth);
  record(
    "GET /api/admin/leads",
    adminLeads.res.ok && Array.isArray(adminLeads.body?.items) && adminLeads.body.items.length >= 1,
    `status=${adminLeads.res.status} count=${adminLeads.body?.items?.length ?? "?"}`,
  );

  const created = await req("/api/admin/services", {
    method: "POST",
    headers: auth.headers,
    json: {
      slug: `smoke-svc-${Date.now()}`,
      titleFa: "سرویس دود",
      titleEn: "Smoke service",
      status: "DRAFT",
    },
  });
  const createdId = created.body?.item?.id;
  record("POST /api/admin/services (CRUD sample)", created.res.status === 201 && createdId, `status=${created.res.status}`);

  const patched = await req(`/api/admin/services/${createdId}`, {
    method: "PATCH",
    headers: auth.headers,
    json: { titleEn: "Smoke service updated" },
  });
  record(
    "PATCH /api/admin/services/:id",
    patched.res.ok && patched.body?.item?.titleEn === "Smoke service updated",
    `status=${patched.res.status}`,
  );

  const deleted = await req(`/api/admin/services/${createdId}`, { method: "DELETE", ...auth });
  record("DELETE /api/admin/services/:id", deleted.res.ok && deleted.body?.ok === true, `status=${deleted.res.status}`);

  const adminLegal = await req("/api/admin/legal", auth);
  record(
    "GET /api/admin/legal",
    adminLegal.res.ok && adminLegal.body?.legal?.privacy?.fa && adminLegal.body?.legal?.terms?.en,
    `status=${adminLegal.res.status}`,
  );

  const updatedLegal = {
    privacy: { fa: "حریم دود", en: "Smoke privacy" },
    terms: { fa: "شرایط دود", en: "Smoke terms" },
  };
  const putLegal = await req("/api/admin/legal", { method: "PUT", headers: auth.headers, json: updatedLegal });
  record("PUT /api/admin/legal", putLegal.res.ok && putLegal.body?.legal?.privacy?.en === "Smoke privacy", `status=${putLegal.res.status}`);

  const privacyAfter = await req("/api/public/legal/privacy?locale=en");
  record(
    "GET /api/public/legal/privacy after admin update",
    privacyAfter.body?.body === "Smoke privacy",
    `status=${privacyAfter.res.status}`,
  );

  await req("/api/admin/legal", { method: "PUT", headers: auth.headers, json: adminLegal.body.legal });

  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  const form = new FormData();
  form.append("file", new Blob([png], { type: "image/png" }), "pixel.png");
  const upload = await req("/api/admin/upload", { method: "POST", headers: auth.headers, body: form });
  const url = upload.body?.url;
  record(
    "POST /api/admin/upload (auth)",
    upload.res.status === 201 && typeof url === "string" && url.startsWith("/api/media/"),
    `status=${upload.res.status} url=${url ?? "?"}`,
  );

  if (url) {
    const media = await req(url);
    record(
      "GET /api/media/:id",
      media.res.ok && media.res.headers.get("content-type")?.includes("image/png"),
      `status=${media.res.status}`,
    );
    const listing = await req("/api/media");
    record(
      "GET /api/media (no listing)",
      listing.res.status === 404 || listing.res.status === 405,
      `status=${listing.res.status}`,
    );
  } else {
    record("GET /api/media/:id", false, "skipped — no upload url");
    record("GET /api/media (no listing)", false, "skipped — no upload url");
  }

  const failed = results.filter((r) => !r.ok);
  console.log("");
  console.log(`Summary: ${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
