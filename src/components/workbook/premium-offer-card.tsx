// The workbook → Premium card. Shown only to buyers who qualify (see
// lib/workbook/premium-offer). Pitched as the next step in learning: the book
// explains the rule, Premium is where they say it out loud.

import { Mic } from "lucide-react";
import { CheckoutButton } from "@/components/pricing/checkout-button";
import { WORKBOOK_FIRST_MONTH_LABEL } from "@/lib/workbook/premium-offer";

export function PremiumOfferCard({ thenPrice }: { thenPrice: string | null }) {
  return (
    <section
      id="premium"
      className="space-y-4 rounded-2xl border border-primary/40 bg-primary/5 p-6"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <Mic className="h-4 w-4" /> Workbook buyers only
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          You&apos;ve read the rules. Now say them out loud.
        </h2>
        <p className="text-muted-foreground">
          The book explains why it&apos;s <em>je suis allé</em> and not{" "}
          <em>j&apos;ai allé</em>. Premium is where you practise saying it until
          it comes out without thinking.
        </p>
      </div>
      <ul className="space-y-2 text-[15px]">
        {[
          "Every lesson open, not one a day",
          "Speaking practice with Léon, our AI tutor",
          "Cancel any time from your account",
        ].map((line) => (
          <li key={line} className="flex gap-2.5">
            <span aria-hidden className="text-primary">✓</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <CheckoutButton
        plan="premium"
        billingPeriod="monthly"
        offer="workbook"
        className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground"
      >
        Start Premium for {WORKBOOK_FIRST_MONTH_LABEL}
      </CheckoutButton>
      <p className="text-xs text-muted-foreground">
        {WORKBOOK_FIRST_MONTH_LABEL} for your first month
        {thenPrice ? `, then ${thenPrice} a month` : ", then the regular monthly price"}.
        One per person.
      </p>
    </section>
  );
}
