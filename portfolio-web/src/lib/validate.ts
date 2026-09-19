import { z } from "zod";

export const localeSchema = z.enum(["fa", "en"]).optional();

export const leadSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(1).max(4000),
  locale: z.enum(["fa", "en"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

export const statusSchema = z.enum(["DRAFT", "PUBLISHED"]);

export const serviceSchema = z.object({
  slug: z.string().trim().min(1).max(80),
  titleFa: z.string().trim().min(1),
  titleEn: z.string().trim().min(1),
  summaryFa: z.string().optional().default(""),
  summaryEn: z.string().optional().default(""),
  bodyFa: z.string().optional().default(""),
  bodyEn: z.string().optional().default(""),
  status: statusSchema.optional(),
  sortOrder: z.number().int().optional(),
});

export const projectMediaSchema = z.object({
  url: z.string().trim().min(1),
  altFa: z.string().optional().default(""),
  altEn: z.string().optional().default(""),
  kind: z.string().optional().default("image"),
  sortOrder: z.number().int().optional().default(0),
});

export const projectCollaboratorSchema = z.object({
  nameFa: z.string().trim().min(1),
  nameEn: z.string().trim().min(1),
  roleFa: z.string().optional().default(""),
  roleEn: z.string().optional().default(""),
  sortOrder: z.number().int().optional().default(0),
});

export const projectSchema = z.object({
  slug: z.string().trim().min(1).max(80),
  titleFa: z.string().trim().min(1),
  titleEn: z.string().trim().min(1),
  summaryFa: z.string().optional().default(""),
  summaryEn: z.string().optional().default(""),
  bodyFa: z.string().optional().default(""),
  bodyEn: z.string().optional().default(""),
  challengeFa: z.string().optional().default(""),
  challengeEn: z.string().optional().default(""),
  solutionFa: z.string().optional().default(""),
  solutionEn: z.string().optional().default(""),
  outcomeFa: z.string().optional().default(""),
  outcomeEn: z.string().optional().default(""),
  tagsFa: z.string().optional().default(""),
  tagsEn: z.string().optional().default(""),
  stack: z.string().optional().default(""),
  coverUrl: z.string().optional().default(""),
  status: statusSchema.optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  media: z.array(projectMediaSchema).optional(),
  collaborators: z.array(projectCollaboratorSchema).optional(),
});

export const teamSchema = z.object({
  nameFa: z.string().trim().min(1),
  nameEn: z.string().trim().min(1),
  roleFa: z.string().optional().default(""),
  roleEn: z.string().optional().default(""),
  bioFa: z.string().optional().default(""),
  bioEn: z.string().optional().default(""),
  photoUrl: z.string().optional().default(""),
  status: statusSchema.optional(),
  sortOrder: z.number().int().optional(),
});

export const settingSchema = z.object({
  key: z.string().trim().min(1).max(80),
  value: z.unknown(),
});

const localizedCopySchema = z.object({
  fa: z.string(),
  en: z.string(),
});

export const legalUpdateSchema = z.object({
  privacy: localizedCopySchema,
  terms: localizedCopySchema,
});
