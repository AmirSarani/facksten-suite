export function SectionHeading({
  kicker,
  title,
  lead,
  latin,
}: {
  kicker?: string;
  title: string;
  lead?: string;
  latin?: boolean;
}) {
  return (
    <div className="max-w-2xl min-w-0 break-words">
      {kicker ? (
        <p className="mb-2 font-mono text-[11px] tracking-[0.14em] sm:tracking-[0.22em] text-cta uppercase">{kicker}</p>
      ) : null}
      <h2 className={`text-fluid-title font-semibold ${latin ? "font-brand" : ""}`}>{title}</h2>
      {lead ? <p className="text-fluid-lead mt-3 text-on-surface-variant">{lead}</p> : null}
    </div>
  );
}
