"use client";

// Admin manual-payouts queue: tutors with a payable balance, their saved payout
// destination, and a "Mark as paid" action that records the payout and clears
// the balance. No money moves here — it's the bookkeeping after paying out-of-band.

import { useEffect, useState } from "react";
import { Wallet, Loader2, Check, AlertCircle, RefreshCw } from "lucide-react";

interface Row {
  id: string;
  name: string | null;
  email: string;
  balance: number;
  totalPaid: number;
  payoutMethod: string | null;
  payoutSummary: string;
  hasDetails: boolean;
}

const money = (n: number) => `$${n.toFixed(2)}`;

export function AdminPayouts() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payouts");
      const data = await res.json();
      setRows(data.tutors || []);
    } catch {
      setMsg({ type: "error", text: "Failed to load payouts." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markPaid = async (row: Row) => {
    if (!confirm(`Mark ${money(row.balance)} as paid to ${row.name || row.email}?\n\nPay them via: ${row.payoutSummary}`)) return;
    setPayingId(row.id);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorId: row.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: "success", text: `Recorded ${money(data.amount)} paid to ${row.name || row.email}.` });
        await load();
      } else {
        setMsg({ type: "error", text: data.error || "Couldn't mark as paid." });
      }
    } catch {
      setMsg({ type: "error", text: "Something went wrong." });
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-lg font-bold text-gray-900">Pending payouts</h2>
        </div>
        <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {msg && (
        <div className={`mb-4 flex items-center gap-2 rounded-lg p-3 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-400">No tutors currently have a payable balance.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="py-2 pr-3 font-semibold">Tutor</th>
                <th className="py-2 px-3 font-semibold">Balance</th>
                <th className="py-2 px-3 font-semibold">Payout to</th>
                <th className="py-2 px-3 font-semibold">Paid to date</th>
                <th className="py-2 pl-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 pr-3">
                    <div className="font-medium text-gray-900">{r.name || "—"}</div>
                    <div className="text-xs text-gray-400">{r.email}</div>
                  </td>
                  <td className="py-3 px-3 font-bold text-primary">{money(r.balance)}</td>
                  <td className="py-3 px-3 max-w-[280px]">
                    {r.hasDetails ? (
                      <span className="text-gray-700">{r.payoutSummary}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600"><AlertCircle className="h-3.5 w-3.5" /> No payout details</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-gray-500">{money(r.totalPaid)}</td>
                  <td className="py-3 pl-3 text-right">
                    <button
                      onClick={() => markPaid(r)}
                      disabled={payingId === r.id || !r.hasDetails}
                      title={!r.hasDetails ? "Tutor hasn't set payout details yet" : "Mark this balance as paid"}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {payingId === r.id ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> …</> : "Mark as paid"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
