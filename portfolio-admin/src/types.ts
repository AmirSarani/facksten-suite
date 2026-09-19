export type PublishStatus = "DRAFT" | "PUBLISHED";

export type AdminUser = {
  id: string;
  email: string;
  name?: string;
  role?: string;
};

export type Service = {
  id: string;
  titleFa: string;
  titleEn: string;
  summaryFa?: string;
  summaryEn?: string;
  summary?: string;
  bodyFa?: string;
  bodyEn?: string;
  body?: string;
  status: PublishStatus;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ServiceInput = {
  titleFa: string;
  titleEn: string;
  summaryFa: string;
  summaryEn: string;
  bodyFa: string;
  bodyEn: string;
  status: PublishStatus;
  sortOrder: number;
};

export type ProjectMedia = {
  url: string;
  altFa?: string;
  altEn?: string;
  kind?: string;
  sortOrder?: number;
};

export type ProjectCollaborator = {
  nameFa?: string;
  nameEn?: string;
  roleFa?: string;
  roleEn?: string;
  name?: string;
  role?: string;
  sortOrder?: number;
};

export type ProjectCollaboratorInput = {
  nameFa: string;
  nameEn: string;
  roleFa: string;
  roleEn: string;
  sortOrder?: number;
};

export type CollaboratorField = string | ProjectCollaborator | ProjectCollaboratorInput;

export type Project = {
  id: string;
  titleFa: string;
  titleEn: string;
  summaryFa?: string;
  summaryEn?: string;
  summary?: string;
  bodyFa?: string;
  bodyEn?: string;
  body?: string;
  coverUrl?: string;
  media?: ProjectMedia[];
  mediaUrls: string[];
  collaborators: CollaboratorField[];
  status: PublishStatus;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectInput = ServiceInput & {
  coverUrl: string;
  mediaUrls: string[];
  collaborators: CollaboratorField[];
};

export type LocalizedCopy = {
  fa: string;
  en: string;
};

export type LegalDocs = {
  privacy: LocalizedCopy;
  terms: LocalizedCopy;
};

export type TeamMember = {
  id: string;
  nameFa: string;
  nameEn: string;
  roleFa?: string;
  roleEn?: string;
  bioFa?: string;
  bioEn?: string;
  photoUrl?: string;
  status: PublishStatus;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type TeamMemberInput = {
  nameFa: string;
  nameEn: string;
  roleFa: string;
  roleEn: string;
  bioFa: string;
  bioEn: string;
  photoUrl: string;
  status: PublishStatus;
  sortOrder: number;
};

export type SiteSetting = {
  id: string;
  key: string;
  value: unknown;
  updatedAt?: string;
};

export type SiteSettingInput = {
  key: string;
  value: unknown;
};

export type Lead = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  locale?: string;
  createdAt?: string;
};

export type NavItem = {
  to: string;
  label: string;
  labelFa: string;
};
