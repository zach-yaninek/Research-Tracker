import type { Metadata } from "next";
import { Source_Serif_4, Source_Sans_3 } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const sans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Research Tracker",
  description: "Latest publications from the researchers and fields you follow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-line">
          <div className="mx-auto w-full max-w-3xl px-6 py-5 flex items-baseline justify-between">
            <Link href="/" className="font-serif text-xl tracking-tight">
              Research Tracker
            </Link>
            <nav className="flex gap-6 text-sm text-muted">
              <Link href="/" className="hover:text-accent transition-colors">
                Dashboard
              </Link>
              <Link
                href="/manage"
                className="hover:text-accent transition-colors"
              >
                Manage
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
          {children}
        </main>
        <footer className="border-t border-line">
          <div className="mx-auto w-full max-w-3xl px-6 py-4 text-xs text-faint">
            Data via the Semantic Scholar Academic Graph API.
          </div>
        </footer>
      </body>
    </html>
  );
}
