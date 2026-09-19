import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectCard } from "@/components/project-card";
import { SectionHeading } from "@/components/section-heading";
import { localizeProject, publishedProjects } from "@/lib/content";
import { t } from "@/lib/i18n";
import { isLocale } from "@/lib/locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: t(locale).pages.projectsTitle };
}

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw;
  const dict = t(locale);
  const projects = await publishedProjects();

  return (
    <div className="px-page mx-auto max-w-6xl py-section">
      <SectionHeading
        kicker="PROJECTS"
        title={dict.pages.projectsTitle}
        lead={dict.pages.projectsLead}
        latin={locale === "en"}
      />
      {projects.length === 0 ? (
        <p className="mt-10 text-on-surface-variant">{dict.empty.projects}</p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((row) => {
            const item = localizeProject(row, locale);
            return (
              <ProjectCard
                key={row.slug}
                locale={locale}
                slug={row.slug}
                title={String(item.title)}
                summary={String(item.summary)}
                coverUrl={row.coverUrl}
                featured={row.featured}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
