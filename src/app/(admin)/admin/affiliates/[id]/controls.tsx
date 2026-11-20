"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Affiliate } from "@/lib/affiliates";

const field = "w-full rounded-lg border bg-background px-3 py-2 text-sm";
const label = "mb-1 block text-xs font-medium text-muted-foreground";
const button = "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50";
const secondary = "rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50";

async function patch(body: Record<string, unknown>) {
  const res = await fetch("/api/admin/affiliates", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Couldn't save");
}

export function AffiliateControls({ affiliate, linkedEmail }: { affiliate: Affiliate; linkedEmail: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  async function run(fn: () => Promise<void>, ok: string) {
    setBusy(true);
    setMessage(null);
    try {
      await fn();
      setMessage({ kind: "ok", text: ok });
      router.refresh();
    } catch (e) {
      setMessage({ kind: "error", text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    run(
      () =>
        patch({
          id: affiliate.id,
          name: f.get("name"),
          email: f.get("email"),
          user_email: f.get("user_email") || "",
          commission_rate: Number(f.get("rate")) / 100,
          payout_method: f.get("payout_method") || null,
          payout_details: f.get("payout_details") || null,
          notes: f.get("notes") || null,
        }),
      "Saved.",
    );
  }

  const paused = affiliate.status === "paused";

  return (
    <section className="space-y-4 rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Settings</h2>
        <div className="flex flex-wrap gap-2">
          {!affiliate.stripe_promotion_code_id && affiliate.discount_percent > 0 && (
            <button
              type="button"
              disabled={busy}
              className={secondary}
              onClick={() => run(() => patch({ id: affiliate.id, action: "create_promo" }), "Stripe code created.")}
            >
              Create Stripe code
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            className={secondary}
            onClick={() =>
              run(
                () => patch({ id: affiliate.id, status: paused ? "active" : "paused" }),
                paused ? "Creator resumed." : "Creator paused.",
              )
            }
          >
            {paused ? "Resume creator" : "Pause creator"}
          </button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Pausing stops new signups, the discount code and all further commission. The rate applies to future payments
        only. Code and discount can&apos;t be changed: they are printed in creators&apos; videos.
      </p>

      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="c-name">Name</label>
            <input id="c-name" name="name" defaultValue={affiliate.name} required className={field} />
          </div>
          <div>
            <label className={label} htmlFor="c-email">Contact email</label>
            <input id="c-email" name="email" type="email" defaultValue={affiliate.email} required className={field} />
          </div>
          <div>
            <label className={label} htmlFor="c-user">FrancoLink login email</label>
            <input id="c-user" name="user_email" type="email" defaultValue={linkedEmail} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="c-rate">Commission %</label>
            <input
              id="c-rate"
              name="rate"
              type="number"
              min={1}
              max={50}
              step="0.5"
              defaultValue={Math.round(affiliate.commission_rate * 1000) / 10}
              required
              className={field}
            />
          </div>
          <div>
            <label className={label} htmlFor="c-method">Payout method</label>
            <select id="c-method" name="payout_method" defaultValue={affiliate.payout_method ?? ""} className={field}>
              <option value="">Not set</option>
              <option value="paypal">PayPal</option>
              <option value="wise">Wise</option>
              <option value="bank">Bank transfer</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className={label} htmlFor="c-details">Payout details</label>
            <input id="c-details" name="payout_details" defaultValue={affiliate.payout_details ?? ""} className={field} />
          </div>
        </div>
        <div>
          <label className={label} htmlFor="c-notes">Notes</label>
          <textarea id="c-notes" name="notes" rows={2} defaultValue={affiliate.notes ?? ""} className={field} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={busy} className={button}>{busy ? "Saving…" : "Save"}</button>
          {message && (
            <span className={message.kind === "error" ? "text-sm text-destructive" : "text-sm text-green-600"}>
              {message.text}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

export function RecordPayoutButton({
  affiliateId,
  currency,
  amount,
  defaultMethod,
}: {
  affiliateId: string;
  currency: string;
  amount: string;
  defaultMethod: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function record() {
    const reference = window.prompt(
      `Record that you've sent ${amount}? Enter the PayPal / Wise transaction reference (optional):`,
      "",
    );
    if (reference === null) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/affiliates/${affiliateId}/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency, method: defaultMethod ?? undefined, reference: reference || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't record payout");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="ml-auto flex items-center gap-2">
      {error && <span className="text-destructive">{error}</span>}
      <button type="button" onClick={record} disabled={busy} className={button}>
        {busy ? "Recording…" : `Mark ${amount} paid`}
      </button>
    </span>
  );
}
