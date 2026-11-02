"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const field = "w-full rounded-lg border bg-background px-3 py-2 text-sm";
const label = "mb-1 block text-xs font-medium text-muted-foreground";

export function NewAffiliateForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: String(f.get("code") ?? "").toLowerCase(),
          name: f.get("name"),
          email: f.get("email"),
          user_email: f.get("user_email") || "",
          commission_rate: Number(f.get("rate")) / 100,
          discount_percent: Number(f.get("discount")),
          payout_method: f.get("payout_method") || null,
          payout_details: f.get("payout_details") || null,
          notes: f.get("notes") || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't save");
      form.reset();
      setMessage(data.warning ? { kind: "error", text: data.warning } : { kind: "ok", text: "Creator added." });
      router.refresh();
    } catch (err) {
      setMessage({ kind: "error", text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border bg-card p-5">
      <h2 className="font-semibold">Add a creator</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="aff-name">Name</label>
          <input id="aff-name" name="name" required className={field} placeholder="Marie Dupont" />
        </div>
        <div>
          <label className={label} htmlFor="aff-code">Code (link and discount code)</label>
          <input id="aff-code" name="code" required pattern="[A-Za-z0-9]{3,24}" className={`${field} font-mono uppercase`} placeholder="MARIE" />
        </div>
        <div>
          <label className={label} htmlFor="aff-email">Contact email</label>
          <input id="aff-email" name="email" type="email" required className={field} />
        </div>
        <div>
          <label className={label} htmlFor="aff-user">FrancoLink login email (optional, for their dashboard)</label>
          <input id="aff-user" name="user_email" type="email" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="aff-rate">Commission %</label>
          <input id="aff-rate" name="rate" type="number" min={1} max={50} step="0.5" defaultValue={20} required className={field} />
        </div>
        <div>
          <label className={label} htmlFor="aff-discount">Customer discount % (first payment)</label>
          <input id="aff-discount" name="discount" type="number" min={0} max={50} defaultValue={5} required className={field} />
        </div>
        <div>
          <label className={label} htmlFor="aff-method">Payout method</label>
          <select id="aff-method" name="payout_method" className={field} defaultValue="">
            <option value="">Not set</option>
            <option value="paypal">PayPal</option>
            <option value="wise">Wise</option>
            <option value="bank">Bank transfer</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor="aff-details">Payout details (PayPal email, Wise account…)</label>
          <input id="aff-details" name="payout_details" className={field} />
        </div>
      </div>
      <div>
        <label className={label} htmlFor="aff-notes">Notes</label>
        <textarea id="aff-notes" name="notes" rows={2} className={field} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Saving…" : "Add creator"}
        </button>
        {message && (
          <span className={message.kind === "error" ? "text-sm text-destructive" : "text-sm text-green-600"}>
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}
