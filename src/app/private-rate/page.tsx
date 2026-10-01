// A private rate, for students invited by email.
//
// Unlisted: nothing links here. The tutor sends the URL to the student
// directly, and the page shows a pack only if the signed-in email has an
// invite to it (20261001_private_pack.sql). The secret-link variant, which
// needs no invite, is /private-rate/[token].

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPrivatePacksFor } from "@/lib/credits/private-packs";
import { PrivatePackPicker } from "@/components/student/private-pack-picker";

export const metadata: Metadata = {
  title: "Your lesson rate | FrancoLink",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function PrivateRatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login/student?next=/private-rate");

  const packs = await getPrivatePacksFor(user.email);

  return (
    <>
      <h1 className="font-heading font-extrabold text-3xl text-primary">
        Your lesson rate
      </h1>

      {packs.length > 0 ? (
        <>
          <p className="mt-2 text-gray-600 leading-relaxed">
            The rate we agreed, kept for you. Buy a block of lessons and book
            them whenever suits you. When they run out, come back here for the
            next block at the same price.
          </p>
          <div className="mt-6">
            <PrivatePackPicker packs={packs} />
          </div>
        </>
      ) : (
        <p className="mt-2 text-gray-600 leading-relaxed">
          There&apos;s no private rate on <strong>{user.email}</strong>. If your
          tutor set one up for you, sign in with the email address you gave
          them, or ask them to check it.
        </p>
      )}
    </>
  );
}
