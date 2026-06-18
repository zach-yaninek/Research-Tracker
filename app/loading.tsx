import { PaperListSkeleton } from "@/components/Skeleton";

// Instant shell shown while the dashboard server component renders.
export default function DashboardLoading() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-serif text-3xl">Latest research</h1>
        <div className="mt-2 h-3 w-32 rounded bg-line/80" />
      </div>
      <section>
        <h2 className="mb-4 border-b border-line pb-2 font-serif text-sm uppercase tracking-widest text-faint">
          Researchers
        </h2>
        <PaperListSkeleton rows={3} />
      </section>
    </div>
  );
}
