import Link from "next/link";
import { ArrowLeft, Megaphone } from "lucide-react";
import { OutreachForm } from "./outreach-form";

export const dynamic = "force-dynamic";

export default function NewOutreachPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/outreach"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to reports
        </Link>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase text-primary">
          <Megaphone className="h-3.5 w-3.5" />
          Outreach
        </div>
        <h1 className="text-2xl font-bold">Log an outreach</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Fill this in each time you drop a link or finish an outreach cycle. You&apos;ll get a
          personal tracking link to share — that&apos;s how your signups get credited to you.
        </p>
      </div>

      <OutreachForm />
    </div>
  );
}
