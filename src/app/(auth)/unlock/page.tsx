// The claim screen — where a stranger who paid becomes a FrancoLink account.
//
// This page is the funnel's hinge, so it is deliberately small: one password
// field, an email they cannot edit, and a button that says what it does. It is
// never framed as "register". They already bought something; this unlocks it.
//
// Four states, all handled here rather than in four routes:
//
//   bad or unpaid token  -> a plain explanation and a way to reach us
//   signed in            -> claim on the spot, no form at all
//   guest, new email     -> choose a password
//   guest, known email   -> sign in (discovered by trying, see the client)

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { ClaimWorkbook } from "@/components/workbook/claim-workbook";

export const metadata: Metadata = {
  title: "Open your workbook | FrancoLink",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

interface PageProps {
  searchParams: Promise<{ t?: string }>;
}

export default async function ClaimPage({ searchParams }: PageProps) {
  const { t: token } = await searchParams;

  if (!token) return <Broken />;

  const { data: order } = await service()
    .from("digital_orders")
    .select("id, email, status, user_id, digital_order_items(product_key)")
    .eq("claim_token", token)
    .maybeSingle();

  // One answer for a bad token and an unpaid order, so the page cannot be used
  // to probe which tokens exist.
  if (!order || order.status !== "paid") return <Broken />;

  const items = (order.digital_order_items ?? []) as { product_key: string }[];
  const hasAudio = items.some((i) => i.product_key === "audio_fpp");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Already signed in. Bind it and get out of their way — no form, no screen.
  if (user) {
    if (order.user_id === user.id) redirect("/oto");
    if (!order.user_id) {
      const { error } = await service().rpc("claim_digital_order", {
        p_token: token,
        p_user_id: user.id,
      });
      if (!error) redirect("/oto");
    }
    // Someone else's order, opened from a forwarded email.
    return (
      <Shell title="This workbook belongs to another account">
        <p className="text-muted-foreground">
          It was bought with a different email address. Sign out and sign back in
          with the address you used at checkout, and it will be waiting.
        </p>
        <Link href="/workbook" className="text-primary underline underline-offset-4">
          Go to my workbook
        </Link>
      </Shell>
    );
  }

  return (
    <ClaimWorkbook token={token} email={order.email} hasAudio={hasAudio} />
  );
}

function Broken() {
  return (
    <Shell title="That link isn't valid">
      <p className="text-muted-foreground">
        It may have been mistyped, or the order isn&apos;t complete yet. If you
        paid in the last few minutes, give it a moment and open the link again.
      </p>
      <p className="text-muted-foreground">
        Still stuck? Reply to your receipt and we&apos;ll sort it out.
      </p>
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {children}
    </main>
  );
}
