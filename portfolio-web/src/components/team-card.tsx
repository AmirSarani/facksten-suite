export function TeamCard({
  name,
  role,
  bio,
  photoUrl,
  latin,
}: {
  name: string;
  role: string;
  bio: string;
  photoUrl: string;
  latin?: boolean;
}) {
  return (
    <article className="ambient-card cyber-chamfer-sm min-w-0 p-4 sm:p-5">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="h-16 w-16 shrink-0 border border-outline object-cover" />
        ) : (
          <div className="grid h-16 w-16 shrink-0 place-items-center border border-outline font-brand text-cta">
            {name.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0">
          <h3 className={`break-words font-semibold ${latin ? "font-brand" : ""}`}>{name}</h3>
          <p className="break-words font-mono text-[11px] text-cta">{role}</p>
        </div>
      </div>
      <p className="mt-4 break-words text-sm leading-7 text-on-surface-variant">{bio}</p>
    </article>
  );
}
