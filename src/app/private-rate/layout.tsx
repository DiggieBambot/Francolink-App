// Outside the (student) group on purpose: that layout sends anyone signed out
// to /login and drops where they were going. A secret link must show its
// price to someone who has no account yet.

import { Logo } from "@/components/layout";

export default function PrivateRateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <Logo size="sm" />
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-10">{children}</main>
    </div>
  );
}
