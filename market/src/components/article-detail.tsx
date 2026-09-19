import type { ArticleBlock, TocItem } from "@/lib/article-content";

function IconSchedule({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h5v-2h-4V7h-2v6z" />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
    </svg>
  );
}

function IconBulb({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M9 21h6v-1.5H9V21zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17h8v-2.3c1.8-1.2 3-3.3 3-5.7 0-3.9-3.1-7-7-7z" />
    </svg>
  );
}

export function ArticleMetaRow({
  category,
  minutes,
  dateLabel,
}: {
  category: string;
  minutes: number;
  dateLabel: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2.5 text-xs font-medium text-on-surface-variant sm:mb-6">
      <span className="rounded-full bg-primary-container/10 px-3 py-1 font-semibold text-primary-container">
        {category}
      </span>
      <span className="inline-flex items-center gap-1">
        <IconSchedule className="h-4 w-4 text-primary-container" />
        {minutes} دقیقه مطالعه
      </span>
      <span className="inline-flex items-center gap-1">
        <IconCalendar className="h-4 w-4 text-primary-container" />
        {dateLabel}
      </span>
    </div>
  );
}

export function ArticleAuthor({
  name,
  role,
  avatar,
}: {
  name: string;
  role: string;
  avatar?: string;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("");

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-outline-variant bg-gradient-to-br from-primary-container/30 to-surface-container text-sm font-bold text-primary">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          initials || "ف"
        )}
      </div>
      <div>
        <div className="text-sm font-semibold text-on-surface">{name}</div>
        <div className="text-xs text-on-surface-variant">{role}</div>
      </div>
    </div>
  );
}

export function ArticleToc({ items }: { items: TocItem[] }) {
  if (!items.length) return null;
  return (
    <aside className="hidden lg:col-span-3 lg:block">
      <div className="sticky top-[100px] cyber-chamfer border border-outline bg-surface-container-lowest p-5 shadow-[var(--box-shadow-neon-sm)]">
        <h3 className="mb-3 font-mono text-sm font-bold uppercase tracking-wide text-on-surface">فهرست مطالب</h3>
        <ul className="space-y-2.5 text-sm leading-6 text-on-surface-variant">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="focus-cta block rounded-lg px-2 py-1 transition-colors hover:bg-primary-container/8 hover:text-primary-container"
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export function ArticleMobileToc({ items }: { items: TocItem[] }) {
  if (!items.length) return null;
  return (
    <details className="mb-8 cyber-chamfer border border-outline bg-surface-container-lowest p-4 open:pb-5 lg:hidden">
      <summary className="cursor-pointer list-none text-sm font-bold text-on-surface">
        فهرست مطالب
      </summary>
      <ul className="mt-3 space-y-2 text-sm text-on-surface-variant">
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className="hover:text-primary-container">
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function ArticleBlocks({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <div className="max-w-none text-on-surface">
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          return (
            <h2
              key={i}
              id={block.id}
              className="mt-12 mb-6 scroll-mt-28 text-2xl font-bold first:mt-0 md:text-[32px] md:leading-[44px]"
            >
              {block.text}
            </h2>
          );
        }
        if (block.type === "paragraph") {
          return (
            <p key={i} className="mb-6 text-base leading-7 text-on-surface-variant">
              {block.text}
            </p>
          );
        }
        if (block.type === "list") {
          return (
            <ul
              key={i}
              className="mb-6 list-disc space-y-2 pr-5 text-base leading-7 text-on-surface-variant"
            >
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "code") {
          return (
            <pre
              key={i}
              dir="ltr"
              className="mb-6 overflow-x-auto cyber-chamfer-sm bg-background p-4 text-left font-mono text-[13px] leading-5 text-on-surface-variant"
            >
              <code>{block.text}</code>
            </pre>
          );
        }
        if (block.type === "figure") {
          return (
            <figure key={i} className="my-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={block.src}
                alt={block.caption || ""}
                className="w-full cyber-chamfer-sm border border-outline shadow-[var(--box-shadow-neon-sm)]"
              />
              {block.caption ? (
                <figcaption className="mt-2 text-center text-xs font-medium text-secondary">
                  {block.caption}
                </figcaption>
              ) : null}
            </figure>
          );
        }
        if (block.type === "callout") {
          return (
            <div
              key={i}
              className="my-8 cyber-chamfer-sm border-r-4 border-primary-container alert-info p-6"
            >
              <h4 className="mb-2 flex items-center gap-2 text-xl font-semibold text-on-surface">
                <IconBulb className="h-5 w-5 text-primary" />
                {block.title}
              </h4>
              <p className="m-0 text-base leading-7 text-on-surface-variant">{block.text}</p>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
