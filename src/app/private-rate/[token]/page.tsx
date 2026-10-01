// A private rate behind a secret link (20261002_private_pack_link.sql).
//
// Anyone with the URL sees the price, signed in or not. Buying still needs an
// account -- the lessons are credited to one -- so a signed-out visitor is sent
// to sign up and brought straight back here.
//
// A rotated or switched-off link 404s rather than explaining itself: a
// forwarded copy should look like nothing at all.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPrivatePackByToken } from "@/lib/credits/private-packs";
import { PrivatePackPicker } from "@/components/student/private-pack-picker";

export const metadata: Metadata = {
  title: "Your lesson rate | FrancoLink",
  robots: { index: false, follow: false },
  // The token is the whole secret; don't hand it to every link they click.
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function PrivateRateLinkPage({ params }: PageProps) {
  const { token } = await params;
  const pack = await getPrivatePackByToken(token);
  if (!pack) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const here = `/private-rate/${token}`;
  const next = `?next=${encodeURIComponent(here)}`;

  return (
    <>
      <h1 className="font-heading font-extrabold text-3xl text-primary">
        Your lesson rate
      </h1>
      <p className="mt-2 text-gray-600 leading-relaxed">
        The rate we agreed, kept for you. Buy a block of lessons and book them
        whenever suits you. When they run out, come back to this link for the
        next block at the same price.
      </p>

      <div className="mt-6">
        <PrivatePackPicker
          packs={[pack]}
          token={token}
          signupHref={user ? undefined : `/signup/student${next}`}
        />
      </div>

      {!user && (
        <p className="mt-4 text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href={`/login/student${next}`}
            className="font-semibold text-secondary hover:underline"
          >
            Log in
          </Link>
        </p>
      )}
    </>
  );
}
