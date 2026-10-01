// Private rates: who may buy an unlisted pack.
//
// Two ways to sell a private pack:
//
//   secret link  send /private-rate/<token>. Anyone holding it sees the price
//                and can buy. "New link" kills every old copy at once.
//   invite       add an email, send /private-rate. Only that email can buy.
//
// Revoking or rotating stops future purchases and leaves lessons already
// bought untouched.

import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { APP_URL } from "@/lib/site/hosts";
import { normalizeEmail } from "@/lib/credits/private-packs";

export const metadata: Metadata = { title: "Private rates | Admin" };
export const dynamic = "force-dynamic";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/** Server actions are public endpoints; each one checks for itself. */
async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
  if ((data?.role || "").toUpperCase() !== "ADMIN") redirect("/admin/login");
}

async function addInvite(formData: FormData) {
  "use server";
  await assertAdmin();
  const email = normalizeEmail(String(formData.get("email") || ""));
  const packKey = String(formData.get("pack_key") || "");
  const note = String(formData.get("note") || "").trim() || null;
  if (!email.includes("@") || !packKey) return;

  const { error } = await service()
    .from("private_pack_invites")
    .insert({ email, pack_key: packKey, note });
  // 23505: already invited to this pack. Adding twice is a no-op, not an error.
  if (error && error.code !== "23505") {
    console.error("[admin/private-rate] add failed", error);
  }
  revalidatePath("/admin/pricing/private-rate");
}

async function newLink(formData: FormData) {
  "use server";
  await assertAdmin();
  const packKey = String(formData.get("pack_key") || "");
  if (!packKey) return;
  // Same shape as the migration's: 32 hex characters, 122 random bits.
  const token = crypto.randomUUID().replace(/-/g, "");
  await service()
    .from("starter_packs")
    .update({ share_token: token })
    .eq("pack_key", packKey)
    .eq("visibility", "private");
  revalidatePath("/admin/pricing/private-rate");
}

async function linkOff(formData: FormData) {
  "use server";
  await assertAdmin();
  const packKey = String(formData.get("pack_key") || "");
  if (!packKey) return;
  await service()
    .from("starter_packs")
    .update({ share_token: null })
    .eq("pack_key", packKey)
    .eq("visibility", "private");
  revalidatePath("/admin/pricing/private-rate");
}

async function revokeInvite(formData: FormData) {
  "use server";
  await assertAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await service()
    .from("private_pack_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("revoked_at", null);
  revalidatePath("/admin/pricing/private-rate");
}

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export default async function PrivateRatePage() {
  await assertAdmin();
  const db = service();

  const [{ data: packs }, { data: invites }] = await Promise.all([
    db
      .from("starter_packs")
      .select("pack_key, lessons, price_cents, credit_days, active, share_token")
      .eq("visibility", "private")
      .order("sort_order"),
    db
      .from("private_pack_invites")
      .select("id, email, pack_key, note, created_at")
      .is("revoked_at", null)
      .order("created_at", { ascending: false }),
  ]);

  // Who has signed up, and how many blocks each has bought.
  const emails = (invites ?? []).map((i) => i.email);
  const { data: users } = emails.length
    ? await db.from("users").select("id, email").in("email", emails)
    : { data: [] as { id: string; email: string }[] };
  const userByEmail = new Map(
    (users ?? []).map((u) => [normalizeEmail(u.email || ""), u.id as string])
  );
  const ids = [...userByEmail.values()];
  const { data: bought } = ids.length
    ? await db
        .from("starter_pack_purchases")
        .select("user_id, pack_key")
        .in("user_id", ids)
        .eq("status", "paid")
        .eq("pack_visibility", "private")
    : { data: [] as { user_id: string; pack_key: string }[] };

  const boughtCount = (email: string, packKey: string) => {
    const uid = userByEmail.get(email);
    return (bought ?? []).filter((b) => b.user_id === uid && b.pack_key === packKey).length;
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Private rates</h1>
        <p className="text-muted-foreground mt-1">
          Send the secret link to anyone you want to have the rate. Or, to
          limit it to specific people, invite them by email below and send{" "}
          <code className="text-foreground">{APP_URL}/private-rate</code>{" "}
          instead.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {(packs ?? []).map((p) => (
          <div key={p.pack_key} className="p-4 bg-card border border-border rounded-lg">
            <div className="font-semibold text-foreground">
              {p.lessons} lessons for {money(p.price_cents)}
            </div>
            <div className="text-sm text-muted-foreground">
              {money(p.price_cents / p.lessons)} a lesson · lasts {p.credit_days ?? 30} days
              {!p.active && " · not on sale"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{p.pack_key}</div>

            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Secret link
              </div>
              {p.share_token ? (
                <input
                  readOnly
                  value={`${APP_URL}/private-rate/${p.share_token}`}
                  className="mt-1 w-full px-2 py-1.5 rounded-md border border-border bg-background text-foreground text-xs font-mono"
                />
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">Off</p>
              )}
              <div className="mt-2 flex gap-4">
                <form action={newLink}>
                  <input type="hidden" name="pack_key" value={p.pack_key} />
                  <button type="submit" className="text-sm font-semibold text-primary hover:underline">
                    {p.share_token ? "New link" : "Turn on"}
                  </button>
                </form>
                {p.share_token && (
                  <form action={linkOff}>
                    <input type="hidden" name="pack_key" value={p.pack_key} />
                    <button type="submit" className="text-sm font-semibold text-red-700 hover:underline">
                      Turn off
                    </button>
                  </form>
                )}
              </div>
              {p.share_token && (
                <p className="mt-1 text-xs text-muted-foreground">
                  New link stops the old one working for everyone.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <form action={addInvite} className="p-4 bg-card border border-border rounded-lg space-y-3">
        <h2 className="font-semibold text-foreground">Invite a student</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            name="email"
            type="email"
            required
            placeholder="student@example.com"
            className="px-3 py-2 rounded-md border border-border bg-background text-foreground"
          />
          <select
            name="pack_key"
            required
            className="px-3 py-2 rounded-md border border-border bg-background text-foreground"
          >
            {(packs ?? []).map((p) => (
              <option key={p.pack_key} value={p.pack_key}>
                {p.lessons} × {money(p.price_cents / p.lessons)}
              </option>
            ))}
          </select>
        </div>
        <input
          name="note"
          placeholder="Note (optional), e.g. from Superprof"
          className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-primary text-white font-semibold hover:bg-primary-600"
        >
          Add invite
        </button>
      </form>

      <div className="bg-card border border-border rounded-lg divide-y divide-border">
        {(invites ?? []).length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No one invited yet.</p>
        )}
        {(invites ?? []).map((i) => (
          <div key={i.id} className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="font-medium text-foreground truncate">{i.email}</div>
              <div className="text-sm text-muted-foreground">
                {userByEmail.has(i.email) ? "Signed up" : "No account yet"} ·{" "}
                {boughtCount(i.email, i.pack_key)} bought
                {i.note ? ` · ${i.note}` : ""}
              </div>
            </div>
            <form action={revokeInvite}>
              <input type="hidden" name="id" value={i.id} />
              <button
                type="submit"
                className="text-sm font-semibold text-red-700 hover:underline"
              >
                Revoke
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
