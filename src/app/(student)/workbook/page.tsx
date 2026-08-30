// The library — where a workbook buyer lands, and where the upsell lives.
//
// Two jobs, in this order. First, give them the thing they paid for, without
// friction or a second sales pitch in the way. Second, be a page worth
// returning to: PRD §6 turns on the observation that a PDF is opened once, and
// every day a buyer does not open the book, the starter-pack offer decays.
// So the workbook is *here*, on a page we control, rather than only in their
// Downloads folder.
//
// The upsell sits below the content, never above it. Someone who came back to
// do Partie 3 should reach Partie 3 first.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { BookOpen, Headphones, Download, ArrowRight, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "My workbook | FrancoLink",
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

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login/student?next=/workbook");

  const db = service();

  const { data: orders } = await db
    .from("digital_orders")
    .select("id, created_at, digital_order_items(product_key)")
    .eq("user_id", user.id)
    .eq("status", "paid");

  const owned = new Set<string>();
  for (const o of orders ?? []) {
    for (const i of (o.digital_order_items ?? []) as { product_key: string }[]) {
      owned.add(i.product_key);
    }
  }

  // Someone who wandered here without buying. Send them to the offer rather
  // than showing an empty shelf.
  if (!owned.has("workbook_fpp")) return <NothingYet />;

  const hasAudio = owned.has("audio_fpp");

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-1">
        <p className="text-sm font-medium text-primary">Your library</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Le Français Pas à Pas
        </h1>
        <p className="text-muted-foreground">
          A0 to B2, one step at a time. Pick up where you left off.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <Tile
          icon={<BookOpen className="h-5 w-5" />}
          title="Work through it online"
          body="Exercises mark themselves as you type, and your progress is saved."
          href="/workbook/read"
          cta="Open the workbook"
          primary
        />
        <Tile
          icon={<Download className="h-5 w-5" />}
          title="Download the PDF"
          body="The whole book, print-ready, yours to keep."
          href="/api/workbook/download"
          cta="Download"
        />
        {hasAudio ? (
          <Tile
            icon={<Headphones className="h-5 w-5" />}
            title="Audio pack"
            body="Every dialogue and drill, at natural speed and again slowly."
            href="/workbook/read#audio"
            cta="Listen"
          />
        ) : (
          <Tile
            icon={<Lock className="h-5 w-5" />}
            title="Audio pack"
            body="Hear every dialogue and pronunciation drill read aloud, twice."
            href="/francais-pas-a-pas/audio"
            cta="Add it — $17"
            muted
          />
        )}
      </section>

    </main>
  );
}

function Tile({
  icon, title, body, href, cta, primary, muted,
}: {
  icon: React.ReactNode; title: string; body: string;
  href: string; cta: string; primary?: boolean; muted?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-5 ${
        primary ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      } ${muted ? "opacity-90" : ""}`}
    >
      <div className="flex items-center gap-2 text-primary">{icon}</div>
      <div className="space-y-1">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
      <Link
        href={href}
        className={`mt-auto inline-flex items-center gap-1.5 text-sm font-medium ${
          primary ? "text-primary" : "text-foreground"
        } underline-offset-4 hover:underline`}
      >
        {cta} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

// The reason this page exists commercially. Phrased as the next step in
// learning rather than as an advert, because that is what it actually is: the
// book explains the grammar, and a person is what turns it into speech.
function NothingYet() {
  return (
    <main className="mx-auto max-w-md space-y-4 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Nothing here yet
      </h1>
      <p className="text-muted-foreground">
        Your library is where the workbook lives once you have it.
      </p>
      <Link
        href="/francais-pas-a-pas"
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-medium text-primary-foreground"
      >
        See the workbook <ArrowRight className="h-4 w-4" />
      </Link>
    </main>
  );
}
