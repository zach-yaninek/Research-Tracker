"use client";

// Catch-all UI for unexpected errors on any page (e.g. a cold-cache request
// that gets rate-limited). Keeps the app from showing a raw stack trace.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const rateLimited = /429|too many requests/i.test(error.message);
  return (
    <div className="rounded border border-line px-6 py-12 text-center">
      <h1 className="font-serif text-2xl">
        {rateLimited ? "Rate limited" : "Something went wrong"}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted">
        {rateLimited
          ? "Semantic Scholar returned too many requests. If you just added or changed your API key, restart the dev server; otherwise wait a moment and try again."
          : "An unexpected error occurred while loading this page."}
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded border border-line px-4 py-2 text-sm hover:bg-accent-soft"
      >
        Try again
      </button>
    </div>
  );
}
