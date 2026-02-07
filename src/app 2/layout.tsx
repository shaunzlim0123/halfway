import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Halfway — Find Your Meeting Point",
  description:
    "Find the fairest midpoint between two people and pick a great restaurant or cafe to meet at.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Young+Serif&family=Figtree:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-deep text-text-primary min-h-screen relative">
        <header className="relative z-10 border-b border-border/40">
          <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
            <a href="/" className="flex items-baseline gap-3">
              <span className="font-display text-2xl text-saffron tracking-tight">
                Halfway
              </span>
              <span className="text-text-muted text-sm font-light tracking-wide hidden sm:inline">
                meet in the middle
              </span>
            </a>
            <div className="flex items-center gap-2 text-text-muted text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
              online
            </div>
          </div>
        </header>
        <main className="relative z-10 max-w-5xl mx-auto px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
