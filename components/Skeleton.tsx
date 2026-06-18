// Loading placeholders shown while a Suspense-wrapped section streams in.
// Shapes roughly mirror PaperList so the layout doesn't jump when data arrives.

function Bar({ className = "" }: { className?: string }) {
  return <div className={`h-3 rounded bg-line/80 ${className}`} />;
}

function PaperItemSkeleton() {
  return (
    <li className="border-b border-line py-4 last:border-b-0">
      <Bar className="h-4 w-3/4" />
      <Bar className="mt-2 w-1/2" />
      <Bar className="mt-2 w-1/3" />
    </li>
  );
}

/** Placeholder for a PaperList while its papers load. */
export function PaperListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <ul className="animate-pulse" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <PaperItemSkeleton key={i} />
      ))}
    </ul>
  );
}
