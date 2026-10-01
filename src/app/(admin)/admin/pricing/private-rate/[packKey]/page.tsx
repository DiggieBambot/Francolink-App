// Edit one private pack: what it sells, and what its page says.
//
// Settings write straight to starter_packs. The margin trigger
// (starter_packs_margin_ok) still applies, so a price per lesson at or below
// tutor pay is refused with its own message rather than saved.
//
// Text writes the whole {en, fr} object to page_copy. Empty rows are dropped
// on the page (see resolveContent), which is how a question or step is
// removed; extra blank rows below the last one are how one is added.
// Purchases already made are untouched by any of this: each one snapshots
// its price, lessons and lifetime at checkout.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { APP_URL } from "@/lib/site/hosts";
import {
  RATE_LANGS,
  rawContent,
  type PageContent,
  type RateLang,
  type StoredContent,
} from "@/lib/credits/private-rate-copy";
import { assertAdmin, service } from "../admin";

export const metadata: Metadata = { title: "Edit private rate | Admin" };
export const dynamic = "force-dynamic";

/** Blank rows offered below the filled ones, for adding. */
const SPARE = { steps: 1, roomPoints: 2, faq: 3 };

const LANG_NAME: Record<RateLang, string> = { en: "English", fr: "Français" };

const here = (packKey: string) => `/admin/pricing/private-rate/${packKey}`;

function str(form: FormData, name: string): string {
  return String(form.get(name) ?? "").trim();
}

/** Indexed rows from the form, e.g. en.faq.0.q, en.faq.1.q … */
function rows(form: FormData, prefix: string): number {
  let n = 0;
  for (const key of form.keys()) {
    if (!key.startsWith(prefix)) continue;
    const i = Number(key.slice(prefix.length).split(".")[0]);
    if (Number.isInteger(i)) n = Math.max(n, i + 1);
  }
  return n;
}

function readContent(form: FormData, lang: RateLang): PageContent {
  const f = (k: string) => str(form, `${lang}.${k}`);
  const range = (k: string) => [...Array(rows(form, `${lang}.${k}.`)).keys()];
  return {
    welcome: f("welcome"),
    welcomeBody: f("welcomeBody"),
    steps: range("steps")
      .map((i) => ({ title: f(`steps.${i}.title`), body: f(`steps.${i}.body`) }))
      .filter((s) => s.title || s.body),
    roomBody: f("roomBody"),
    roomPoints: range("roomPoints").map((i) => f(`roomPoints.${i}`)).filter(Boolean),
    lessonLength: f("lessonLength"),
    faq: range("faq")
      .map((i) => ({ q: f(`faq.${i}.q`), a: f(`faq.${i}.a`) }))
      .filter((q) => q.q || q.a),
  };
}

async function save(formData: FormData) {
  "use server";
  await assertAdmin();
  const packKey = str(formData, "pack_key");

  const dollars = Number(str(formData, "price"));
  const lessons = Number(str(formData, "lessons"));
  const days = Number(str(formData, "credit_days"));
  const fail = (msg: string) =>
    redirect(`${here(packKey)}?error=${encodeURIComponent(msg)}`);

  if (!Number.isFinite(dollars) || dollars <= 0) fail("Price must be more than $0.");
  if (!Number.isInteger(lessons) || lessons < 1 || lessons > 100)
    fail("Lessons must be a whole number from 1 to 100.");
  if (!Number.isInteger(days) || days < 1 || days > 365)
    fail("Days must be a whole number from 1 to 365.");

  const page_copy: StoredContent = {};
  for (const lang of RATE_LANGS) page_copy[lang] = readContent(formData, lang);

  const { error } = await service()
    .from("starter_packs")
    .update({
      price_cents: Math.round(dollars * 100),
      lessons,
      credit_days: days,
      active: formData.get("active") === "on",
      page_copy,
    })
    .eq("pack_key", packKey)
    .eq("visibility", "private");

  if (error) {
    // The margin trigger's message names the numbers; pass it through.
    fail(error.message.includes("tutor is paid")
      ? "That price per lesson is at or below what the tutor is paid. Raise the price or lower the lessons."
      : `Couldn't save: ${error.message}`);
  }

  revalidatePath(here(packKey));
  revalidatePath("/admin/pricing/private-rate");
  redirect(`${here(packKey)}?saved=1`);
}

async function resetText(formData: FormData) {
  "use server";
  await assertAdmin();
  const packKey = str(formData, "pack_key");
  await service()
    .from("starter_packs")
    .update({ page_copy: {} })
    .eq("pack_key", packKey)
    .eq("visibility", "private");
  revalidatePath(here(packKey));
  redirect(`${here(packKey)}?saved=1`);
}

const input =
  "w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm";
const label = "block text-sm font-medium text-foreground mb-1";

function Field({
  name,
  value,
  title,
  long,
}: {
  name: string;
  value: string;
  title?: string;
  long?: boolean;
}) {
  return (
    <div>
      {title && <label htmlFor={name} className={label}>{title}</label>}
      {long ? (
        <textarea id={name} name={name} defaultValue={value} rows={3} className={input} />
      ) : (
        <input id={name} name={name} defaultValue={value} className={input} />
      )}
    </div>
  );
}

function LangSection({ lang, content }: { lang: RateLang; content: PageContent }) {
  const n = (k: string) => `${lang}.${k}`;
  const pad = <T,>(list: T[], spare: number, blank: T) => [
    ...list,
    ...Array(spare).fill(blank),
  ];

  return (
    <details open={lang === "en"} className="p-4 bg-card border border-border rounded-lg">
      <summary className="cursor-pointer font-semibold text-foreground">
        Page text: {LANG_NAME[lang]}
      </summary>

      <div className="mt-4 space-y-6">
        <fieldset className="space-y-3">
          <legend className="font-semibold text-foreground">Welcome</legend>
          <Field name={n("welcome")} value={content.welcome} title="Heading" />
          <Field name={n("welcomeBody")} value={content.welcomeBody} title="Text" long />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-semibold text-foreground">How it works</legend>
          {pad(content.steps, SPARE.steps, { title: "", body: "" }).map((s, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[14rem_1fr]">
              <Field name={n(`steps.${i}.title`)} value={s.title} title={`Step ${i + 1}`} />
              <Field name={n(`steps.${i}.body`)} value={s.body} title="Detail" />
            </div>
          ))}
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-semibold text-foreground">Where lessons happen</legend>
          <Field name={n("roomBody")} value={content.roomBody} title="Text" long />
          {pad(content.roomPoints, SPARE.roomPoints, "").map((p, i) => (
            <Field key={i} name={n(`roomPoints.${i}`)} value={p} title={`Point ${i + 1}`} />
          ))}
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-semibold text-foreground">Price card</legend>
          <Field
            name={n("lessonLength")}
            value={content.lessonLength}
            title="Lesson length line"
          />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-semibold text-foreground">Questions</legend>
          {pad(content.faq, SPARE.faq, { q: "", a: "" }).map((f, i) => (
            <div key={i} className="space-y-2 pb-3 border-b border-border last:border-0">
              <Field name={n(`faq.${i}.q`)} value={f.q} title={`Question ${i + 1}`} />
              <Field name={n(`faq.${i}.a`)} value={f.a} title="Answer" long />
            </div>
          ))}
        </fieldset>
      </div>
    </details>
  );
}

interface PageProps {
  params: Promise<{ packKey: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}

export default async function EditPrivateRatePage({ params, searchParams }: PageProps) {
  await assertAdmin();
  const [{ packKey }, { saved, error }] = await Promise.all([params, searchParams]);

  const { data: pack } = await service()
    .from("starter_packs")
    .select("pack_key, lessons, price_cents, credit_days, active, share_token, page_copy")
    .eq("pack_key", packKey)
    .eq("visibility", "private")
    .maybeSingle();
  if (!pack) notFound();

  const link = pack.share_token ? `${APP_URL}/private-rate/${pack.share_token}` : null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href="/admin/pricing/private-rate"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Private rates
        </Link>
        <h1 className="mt-1 text-3xl font-bold text-foreground">Edit private rate</h1>
        <p className="text-muted-foreground mt-1">
          Write <code className="text-foreground">{"{lessons}"}</code> or{" "}
          <code className="text-foreground">{"{days}"}</code> anywhere in the text
          and the page fills in the pack&apos;s numbers. Clear a step or question to
          remove it; fill a blank one to add it.
        </p>
        {link && (
          <p className="mt-2 text-sm">
            <a href={link} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">
              Open the page (English)
            </a>
            {" · "}
            <a href={`${link}?lang=fr`} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">
              Français
            </a>
          </p>
        )}
      </div>

      {saved && (
        <p className="p-3 rounded-md bg-green-50 text-green-800 text-sm font-semibold">
          Saved. The page shows it now.
        </p>
      )}
      {error && (
        <p className="p-3 rounded-md bg-red-50 text-red-800 text-sm font-semibold">{error}</p>
      )}

      <form action={save} className="space-y-6">
        <input type="hidden" name="pack_key" value={pack.pack_key} />

        <fieldset className="p-4 bg-card border border-border rounded-lg grid gap-4 sm:grid-cols-3">
          <legend className="px-1 font-semibold text-foreground">The pack</legend>
          <div>
            <label htmlFor="price" className={label}>Price (USD)</label>
            <input
              id="price"
              name="price"
              type="number"
              min="1"
              step="0.01"
              required
              defaultValue={(pack.price_cents / 100).toFixed(2)}
              className={input}
            />
          </div>
          <div>
            <label htmlFor="lessons" className={label}>Lessons</label>
            <input
              id="lessons"
              name="lessons"
              type="number"
              min="1"
              max="100"
              required
              defaultValue={pack.lessons}
              className={input}
            />
          </div>
          <div>
            <label htmlFor="credit_days" className={label}>Lessons last (days)</label>
            <input
              id="credit_days"
              name="credit_days"
              type="number"
              min="1"
              max="365"
              required
              defaultValue={pack.credit_days ?? 30}
              className={input}
            />
          </div>
          <label className="sm:col-span-3 flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" name="active" defaultChecked={pack.active} />
            On sale. Untick to hide the page and stop purchases; ticking it again brings the same link back.
          </label>
          <p className="sm:col-span-3 text-xs text-muted-foreground">
            Changes apply to new purchases only. Lessons already bought keep the
            price and expiry they were sold with.
          </p>
        </fieldset>

        {RATE_LANGS.map((lang) => (
          <LangSection key={lang} lang={lang} content={rawContent(pack.page_copy, lang)} />
        ))}

        <button
          type="submit"
          className="px-5 py-2.5 rounded-md bg-primary text-white font-semibold hover:bg-primary-600"
        >
          Save
        </button>
      </form>

      <form action={resetText} className="pt-2 border-t border-border">
        <input type="hidden" name="pack_key" value={pack.pack_key} />
        <button type="submit" className="text-sm font-semibold text-red-700 hover:underline">
          Reset page text to the original wording
        </button>
        <span className="ml-2 text-xs text-muted-foreground">
          Both languages. Price and lessons stay as they are.
        </span>
      </form>
    </div>
  );
}
