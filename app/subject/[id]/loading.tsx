import { PaperListSkeleton } from "@/components/Skeleton";

export default function SubjectLoading() {
  return (
    <div className="space-y-8">
      <div className="h-3 w-24 rounded bg-line/80" />
      <header className="border-b border-line pb-6">
        <div className="h-3 w-20 rounded bg-line/80" />
        <div className="mt-2 h-8 w-1/2 rounded bg-line/80" />
      </header>
      <div className="grid gap-10 md:grid-cols-2">
        <PaperListSkeleton rows={5} />
        <PaperListSkeleton rows={5} />
      </div>
    </div>
  );
}
