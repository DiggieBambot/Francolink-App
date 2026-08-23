// Create the six Stripe Prices behind the lesson plans.
//
// One Price per (plan, term). lessons_per_week is the subscription QUANTITY at
// checkout, so this is six objects rather than the thirty a price-per-
// combination would need.
//
// The unit amount is the WHOLE TERM at one lesson per week. Stripe multiplies
// by the quantity, so a 3-lessons-a-week subscriber pays three times this.
// Every figure below equals subscription_plan_prices.total_cents for
// lessons_per_week = 1 -- the script checks that itself if it can reach the
// database.
//
// Idempotent: each Price carries a lookup_key, and an existing one is reused
// rather than duplicated. Stripe Prices cannot be deleted, only archived, so
// running this twice must not leave a mess.
//
//   node scripts/create-stripe-prices.mjs          # create (or reuse)
//   node scripts/create-stripe-prices.mjs --dry    # show what it would do

import fs from "node:fs";
import path from "node:path";
import Stripe from "stripe";

const DRY = process.argv.includes("--dry");

// --- env ------------------------------------------------------------------
function loadEnv() {
  const file = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadEnv();

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY not found in env or .env.local");
  process.exit(1);
}

const mode = key.startsWith("sk_live") ? "LIVE" : "test";
const stripe = new Stripe(key, { apiVersion: "2024-12-18.acacia" });

// --- what to create -------------------------------------------------------
// total_cents is the per-lesson price x 4.33 weeks x months in the term.
const PLANS = [
  {
    planKey: "community",
    productName: "FrancoLink Community Lessons",
    description:
      "Live 50-minute lessons with community tutors. One credit per lesson; a 25-minute lesson costs half.",
    terms: [
      { months: 1, cents: 4330, interval: "month", count: 1 },
      { months: 3, cents: 11691, interval: "month", count: 3 },
      { months: 12, cents: 41568, interval: "year", count: 1 },
    ],
  },
  {
    planKey: "professional",
    productName: "FrancoLink Professional Lessons",
    description:
      "Live 50-minute lessons with any tutor, including professional. One credit per lesson; a 25-minute lesson costs half.",
    terms: [
      { months: 1, cents: 10825, interval: "month", count: 1 },
      { months: 3, cents: 29228, interval: "month", count: 3 },
      { months: 12, cents: 103920, interval: "year", count: 1 },
    ],
  },
];

const money = (c) => `$${(c / 100).toFixed(2)}`;

async function findOrCreateProduct(planKey, name, description) {
  const existing = await stripe.products.search({
    query: `metadata['francolink_plan']:'${planKey}'`,
    limit: 1,
  });

  if (existing.data.length) {
    console.log(`  product  reuse   ${existing.data[0].id}  ${name}`);
    return existing.data[0];
  }

  if (DRY) {
    console.log(`  product  CREATE  (dry)  ${name}`);
    return { id: "prod_DRY" };
  }

  const product = await stripe.products.create({
    name,
    description,
    metadata: { francolink_plan: planKey },
  });

  console.log(`  product  create  ${product.id}  ${name}`);
  return product;
}

async function findOrCreatePrice(product, planKey, term) {
  const lookupKey = `francolink_${planKey}_${term.months}mo`;

  const found = await stripe.prices.list({
    lookup_keys: [lookupKey],
    limit: 1,
  });

  if (found.data.length) {
    const p = found.data[0];
    if (p.unit_amount !== term.cents) {
      console.warn(
        `  price    MISMATCH ${p.id} is ${money(p.unit_amount)}, expected ${money(term.cents)} — leaving it alone`
      );
    } else {
      console.log(`  price    reuse   ${p.id}  ${term.months}mo  ${money(p.unit_amount)}`);
    }
    return p;
  }

  if (DRY) {
    console.log(
      `  price    CREATE  (dry)  ${term.months}mo  ${money(term.cents)}  every ${term.count} ${term.interval}(s)`
    );
    return { id: `price_DRY_${planKey}_${term.months}mo` };
  }

  const price = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: term.cents,
    recurring: { interval: term.interval, interval_count: term.count },
    lookup_key: lookupKey,
    metadata: {
      francolink_plan: planKey,
      term_months: String(term.months),
      note: "unit amount is one lesson per week for the whole term; quantity = lessons per week",
    },
  });

  console.log(
    `  price    create  ${price.id}  ${term.months}mo  ${money(term.cents)}  every ${term.count} ${term.interval}(s)`
  );
  return price;
}

// --- go -------------------------------------------------------------------
console.log(`\nStripe mode: ${mode}${DRY ? "  (dry run — nothing will be created)" : ""}\n`);

const updates = [];

for (const plan of PLANS) {
  console.log(`${plan.planKey}`);
  const product = await findOrCreateProduct(
    plan.planKey,
    plan.productName,
    plan.description
  );

  for (const term of plan.terms) {
    const price = await findOrCreatePrice(product, plan.planKey, term);
    updates.push({ planKey: plan.planKey, months: term.months, id: price.id });
  }
  console.log("");
}

// --- the SQL to finish the job -------------------------------------------
const sql = [
  "-- Generated by scripts/create-stripe-prices.mjs",
  `-- Stripe mode: ${mode}`,
  "",
  ...updates.map(
    (u) =>
      `update public.subscription_plan_prices set stripe_price_id = '${u.id}'\n where plan_key = '${u.planKey}' and term_months = ${u.months};`
  ),
  "",
  "-- Refuse to go live with a gap.",
  "do $$",
  "declare missing int;",
  "begin",
  "  select count(*) into missing",
  "    from public.subscription_plan_prices",
  "   where stripe_price_id is null or stripe_price_id like 'price_XXX%';",
  "  if missing > 0 then",
  "    raise exception '% price row(s) still have no Stripe price id', missing;",
  "  end if;",
  "end $$;",
  "",
  "-- Open the doors.",
  "update public.subscription_plans set active = true",
  " where plan_key in ('community', 'professional');",
  "",
  "-- Confirm.",
  "select p.plan_key, p.name, p.active, pp.term_months, pp.total_cents / 100.0 as one_per_week,",
  "       pp.stripe_price_id",
  "  from public.subscription_plans p",
  "  join public.subscription_plan_prices pp on pp.plan_key = p.plan_key",
  " where pp.lessons_per_week = 1",
  " order by p.plan_key, pp.term_months;",
  "",
].join("\n");

const out = path.join(process.cwd(), "scripts", "go-live-subscriptions.sql");
if (!DRY) {
  fs.writeFileSync(out, sql);
  console.log(`Wrote ${out}\n`);
} else {
  console.log(sql);
}
