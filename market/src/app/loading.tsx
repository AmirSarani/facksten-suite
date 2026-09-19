export default function Loading() {
  return (
    <div className="mx-auto max-w-[1280px] animate-pulse px-margin-mobile py-10 md:px-margin-desktop">
      <div className="mb-6 h-10 w-48 rounded-lg bg-surface-container" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl bg-surface-container" />
        ))}
      </div>
    </div>
  );
}
