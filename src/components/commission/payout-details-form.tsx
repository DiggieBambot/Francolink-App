"use client";

// Tutor payout destination form. Manual payouts for now — this just captures
// where the tutor wants to be paid (PayPal / Skrill / Bank / Mobile Money) so an
// admin can pay them and, later, a payment API can read it.

import { useEffect, useState } from "react";
import { Wallet, Check, Loader2, AlertCircle } from "lucide-react";

type Method = "paypal" | "skrill" | "bank" | "mobile_money";

const METHODS: { id: Method; label: string }[] = [
  { id: "paypal", label: "PayPal" },
  { id: "skrill", label: "Skrill" },
  { id: "bank", label: "Bank account" },
  { id: "mobile_money", label: "Mobile Money" },
];

const input =
  "w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";
const label = "block text-sm font-medium text-gray-700 mb-1";

export function PayoutDetailsForm() {
  const [method, setMethod] = useState<Method>("paypal");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [skrillEmail, setSkrillEmail] = useState("");
  const [bank, setBank] = useState({ account_name: "", account_number: "", bank_name: "", swift_iban: "", country: "" });
  const [mm, setMm] = useState({ country: "", number: "", provider: "" });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/tutor/payout-details");
        const data = await res.json();
        if (data.unavailable) setUnavailable(true);
        const d = data.details;
        if (d?.method) {
          setMethod(d.method);
          if (d.paypal_email) setPaypalEmail(d.paypal_email);
          if (d.skrill_email) setSkrillEmail(d.skrill_email);
          if (d.bank) setBank({ account_name: "", account_number: "", bank_name: "", swift_iban: "", country: "", ...d.bank });
          if (d.mobile_money) setMm({ country: "", number: "", provider: "", ...d.mobile_money });
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const payload: Record<string, unknown> = { method };
      if (method === "paypal") payload.paypal_email = paypalEmail;
      if (method === "skrill") payload.skrill_email = skrillEmail;
      if (method === "bank") payload.bank = bank;
      if (method === "mobile_money") payload.mobile_money = mm;

      const res = await fetch("/api/tutor/payout-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) setMsg({ type: "success", text: "Payout details saved." });
      else setMsg({ type: "error", text: data.error || "Couldn't save. Try again." });
    } catch {
      setMsg({ type: "error", text: "Something went wrong. Try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-soft">
      <div className="mb-1 flex items-center gap-2">
        <Wallet className="h-5 w-5 text-primary" />
        <h2 className="font-heading text-lg font-bold text-gray-900">Payout details</h2>
      </div>
      <p className="mb-5 text-sm text-gray-500">
        Where should we send your commission payouts? Payouts are processed manually for now.
      </p>

      {unavailable && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>Payout storage isn&apos;t enabled yet. Once the admin runs the pending database migration, you&apos;ll be able to save here.</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <form onSubmit={save} className="space-y-5">
          {/* Method selector */}
          <div className="flex flex-wrap gap-2">
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                  method === m.id
                    ? "border-primary bg-primary-50 text-primary"
                    : "border-gray-200 text-gray-600 hover:border-primary/40"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {method === "paypal" && (
            <div>
              <label className={label}>PayPal email</label>
              <input type="email" className={input} value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} placeholder="you@example.com" />
            </div>
          )}

          {method === "skrill" && (
            <div>
              <label className={label}>Skrill email</label>
              <input type="email" className={input} value={skrillEmail} onChange={(e) => setSkrillEmail(e.target.value)} placeholder="you@example.com" />
            </div>
          )}

          {method === "bank" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Account holder name</label>
                <input className={input} value={bank.account_name} onChange={(e) => setBank({ ...bank, account_name: e.target.value })} placeholder="Full name on the account" />
              </div>
              <div>
                <label className={label}>Account number</label>
                <input className={input} value={bank.account_number} onChange={(e) => setBank({ ...bank, account_number: e.target.value })} placeholder="Account number" />
              </div>
              <div>
                <label className={label}>Bank name</label>
                <input className={input} value={bank.bank_name} onChange={(e) => setBank({ ...bank, bank_name: e.target.value })} placeholder="Bank name" />
              </div>
              <div>
                <label className={label}>SWIFT / IBAN <span className="text-gray-400">(optional)</span></label>
                <input className={input} value={bank.swift_iban} onChange={(e) => setBank({ ...bank, swift_iban: e.target.value })} placeholder="SWIFT or IBAN" />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Country</label>
                <input className={input} value={bank.country} onChange={(e) => setBank({ ...bank, country: e.target.value })} placeholder="Country" />
              </div>
            </div>
          )}

          {method === "mobile_money" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Country</label>
                <input className={input} value={mm.country} onChange={(e) => setMm({ ...mm, country: e.target.value })} placeholder="e.g. Kenya" />
              </div>
              <div>
                <label className={label}>Mobile number</label>
                <input className={input} value={mm.number} onChange={(e) => setMm({ ...mm, number: e.target.value })} placeholder="e.g. +254 7XX XXX XXX" />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Provider <span className="text-gray-400">(optional)</span></label>
                <input className={input} value={mm.provider} onChange={(e) => setMm({ ...mm, provider: e.target.value })} placeholder="e.g. M-Pesa, MTN, Airtel" />
              </div>
            </div>
          )}

          {msg && (
            <div
              className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}
            >
              {msg.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {msg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50"
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save payout details"}
          </button>
        </form>
      )}
    </div>
  );
}
