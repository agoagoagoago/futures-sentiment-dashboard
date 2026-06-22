import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Futures Sentiment Dashboard — CL & ES",
  description:
    "Market sentiment dashboard and research report for Crude Oil (CL) and S&P 500 E-mini (ES) futures. Research only, not financial advice.",
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/markets/cl", label: "Crude Oil (CL)" },
  { href: "/markets/es", label: "S&P 500 (ES)" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
            <Link href="/" className="font-semibold tracking-tight text-zinc-100">
              Futures Sentiment
              <span className="text-zinc-500 font-normal"> · CL &amp; ES</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="px-3 py-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

        <footer className="border-t border-zinc-800 mt-12">
          <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-zinc-500 space-y-1">
            <p className="font-medium text-zinc-400">
              Research and educational use only — not financial advice.
            </p>
            <p>
              This dashboard presents scenario analysis and sentiment framing, not
              buy/sell recommendations. Data may be placeholder/illustrative until
              manually updated. Verify all figures against primary sources before
              acting. Markets involve risk of loss.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
