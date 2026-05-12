import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ontario Property Intelligence",
  description:
    "Property intelligence platform for identifying landlord-owned properties across Ontario.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          {/* ── Top navigation ── */}
          <header className="border-b border-gray-200 bg-white shadow-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                    <svg
                      className="h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                      />
                    </svg>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    Ontario Property Intelligence
                  </span>
                </div>

                <nav className="flex items-center gap-6">
                  <a
                    href="/"
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Dashboard
                  </a>
                  <a
                    href="/landlord-opportunities"
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Landlord Opportunities
                  </a>
                  <a
                    href="/import"
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Import Data
                  </a>
                </nav>
              </div>
            </div>
          </header>

          {/* ── Page content ── */}
          <main className="flex-1">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>

          {/* ── Footer ── */}
          <footer className="border-t border-gray-200 bg-white py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <p className="text-center text-xs text-gray-500">
                Ontario Property Intelligence Platform — property-level data only.
                No personal contact information is stored or displayed.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
