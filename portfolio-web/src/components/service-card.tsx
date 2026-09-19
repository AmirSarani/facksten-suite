export function ServiceCard({
  index,
  title,
  summary,
  latin,
}: {
  index: number;
  title: string;
  summary: string;
  latin?: boolean;
}) {
  return (
    <article className="ambient-card product-card cyber-chamfer-sm min-w-0 p-4 sm:p-5">
      <p className="font-mono text-[11px] text-cta">
        {String(index + 1).padStart(2, "0")}
      </p>
      <h3 className={`mt-3 break-words text-lg font-semibold ${latin ? "font-brand" : ""}`}>{title}</h3>
      <p className="mt-2 break-words text-sm leading-7 text-on-surface-variant">{summary}</p>
    </article>
  );
}
