import type { Metadata } from "next";

// The private review page. English only, never indexed, and outside the
// locale layout, so it has its own <html>.
export const metadata: Metadata = {
  title: "Forum review",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
