import { prisma } from "@/lib/db";
import { pickLocalized, type Locale } from "@/lib/locale";

export function localizeService(row: {
  slug: string;
  titleFa: string;
  titleEn: string;
  summaryFa: string;
  summaryEn: string;
  bodyFa: string;
  bodyEn: string;
  sortOrder: number;
}, locale: Locale) {
  return {
    slug: row.slug,
    sortOrder: row.sortOrder,
    title: pickLocalized(row, locale, "title"),
    summary: pickLocalized(row, locale, "summary"),
    body: pickLocalized(row, locale, "body"),
  };
}

export function splitCsv(value: string): string[] {
  return value
    .split(/[,،]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function localizeProject(
  row: {
    slug: string;
    titleFa: string;
    titleEn: string;
    summaryFa: string;
    summaryEn: string;
    bodyFa: string;
    bodyEn: string;
    challengeFa?: string;
    challengeEn?: string;
    solutionFa?: string;
    solutionEn?: string;
    outcomeFa?: string;
    outcomeEn?: string;
    tagsFa?: string;
    tagsEn?: string;
    stack?: string;
    coverUrl: string;
    featured: boolean;
    sortOrder: number;
    media?: {
      url: string;
      altFa: string;
      altEn: string;
      kind: string;
      sortOrder: number;
    }[];
    collaborators?: {
      nameFa: string;
      nameEn: string;
      roleFa: string;
      roleEn: string;
      sortOrder: number;
    }[];
  },
  locale: Locale,
) {
  const tags = splitCsv(pickLocalized(row, locale, "tags"));
  return {
    slug: row.slug,
    coverUrl: row.coverUrl,
    featured: row.featured,
    sortOrder: row.sortOrder,
    title: pickLocalized(row, locale, "title"),
    summary: pickLocalized(row, locale, "summary"),
    body: pickLocalized(row, locale, "body"),
    challenge: pickLocalized(row, locale, "challenge"),
    solution: pickLocalized(row, locale, "solution"),
    outcome: pickLocalized(row, locale, "outcome"),
    tags,
    stack: splitCsv(row.stack ?? ""),
    media: (row.media ?? []).map((m) => ({
      url: m.url,
      kind: m.kind,
      sortOrder: m.sortOrder,
      alt: locale === "en" ? m.altEn : m.altFa,
    })),
    collaborators: (row.collaborators ?? []).map((c) => ({
      name: locale === "en" ? c.nameEn : c.nameFa,
      role: locale === "en" ? c.roleEn : c.roleFa,
      sortOrder: c.sortOrder,
    })),
  };
}

export function localizeTeam(
  row: {
    nameFa: string;
    nameEn: string;
    roleFa: string;
    roleEn: string;
    bioFa: string;
    bioEn: string;
    photoUrl: string;
    sortOrder: number;
  },
  locale: Locale,
) {
  return {
    photoUrl: row.photoUrl,
    sortOrder: row.sortOrder,
    name: pickLocalized(row, locale, "name"),
    role: pickLocalized(row, locale, "role"),
    bio: pickLocalized(row, locale, "bio"),
  };
}

export async function publishedServices() {
  return prisma.service.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function publishedProjects() {
  return prisma.project.findMany({
    where: { status: "PUBLISHED" },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      collaborators: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function publishedProjectBySlug(slug: string) {
  return prisma.project.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      collaborators: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function publishedTeam() {
  return prisma.teamMember.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}
