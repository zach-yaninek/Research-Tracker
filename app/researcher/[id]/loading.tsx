import { PaperListSkeleton } from "@/components/Skeleton";

export default function ResearcherLoading() {
  return (
    <div className="space-y-8">
      <div className="h-3 w-24 rounded bg-line/80" />
      <header className="animate-pulse space-y-3 border-b border-line pb-6" aria-hidden>
        <div className="h-8 w-2/3 rounded bg-line/80" />
        <div className="h-3 w-1/2 rounded bg-line/80" />
      </header>
      <PaperListSkeleton rows={6} />
    </div>
  );
}
