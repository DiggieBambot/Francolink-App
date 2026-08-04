import { generateSlots, zonedTimeToUtc, isSlotBookable } from "../src/lib/booking/slots";

let pass = 0, fail = 0;
function check(name: string, cond: boolean, extra = "") {
  if (cond) { pass++; console.log("  ok   " + name); }
  else { fail++; console.log("  FAIL " + name + (extra ? "  → " + extra : "")); }
}

const TZ = "Europe/Paris";
const base = { timezone: TZ, busy: [], minNoticeHours: 12, bufferMinutes: 10, stepMinutes: 30 };

console.log("\n1. DST correctness (Paris 09:00 → UTC)");
// Winter: Paris = UTC+1 → 08:00Z.  Summer: UTC+2 → 07:00Z.
const win = zonedTimeToUtc(2026, 1, 15, 9 * 60, TZ);
const sum = zonedTimeToUtc(2026, 7, 15, 9 * 60, TZ);
check("winter 09:00 Paris = 08:00Z", win.toISOString() === "2026-01-15T08:00:00.000Z", win.toISOString());
check("summer 09:00 Paris = 07:00Z", sum.toISOString() === "2026-07-15T07:00:00.000Z", sum.toISOString());

console.log("\n2. Basic generation (Mon 09:00-12:00, 50-min lessons)");
const from = new Date("2026-01-05T00:00:00Z"); // Monday
const slots50 = generateSlots({ ...base, minNoticeHours: 0, rules: [{ weekday: 1, start_minute: 540, end_minute: 720 }],
  durations: [50], from, to: new Date("2026-01-06T00:00:00Z") });
console.log("     " + slots50.map(s => s.start.toISOString().slice(11,16)).join(", "));
check("generates 5 slots in a 3h block", slots50.length === 5, String(slots50.length));
check("first is 08:00Z (=09:00 Paris)", slots50[0]?.start.toISOString() === "2026-01-05T08:00:00.000Z", slots50[0]?.start.toISOString());
check("lesson never ends after 12:00 Paris (11:00Z)",
  slots50.every(s => s.end.getTime() <= new Date("2026-01-05T11:00:00.000Z").getTime()));

console.log("\n3. Min-notice honoured");
const soon = generateSlots({ ...base, rules: [{ weekday: 1, start_minute: 540, end_minute: 720 }],
  durations: [50], from: new Date("2026-01-05T00:00:00Z"), to: new Date("2026-01-12T00:00:00Z") });
check("nothing inside 12h of `from`",
  soon.every(s => s.start.getTime() >= new Date("2026-01-05T12:00:00Z").getTime()),
  soon[0]?.start.toISOString());

console.log("\n4. Busy intervals block slots (incl. buffer)");
const busyOne = [{ start: new Date("2026-01-05T08:00:00Z"), end: new Date("2026-01-05T08:50:00Z") }];
const withBusy = generateSlots({ ...base, minNoticeHours: 0, rules: [{ weekday: 1, start_minute: 540, end_minute: 720 }],
  durations: [50], from, to: new Date("2026-01-06T00:00:00Z"), busy: busyOne });
console.log("     " + withBusy.map(s => s.start.toISOString().slice(11,16)).join(", "));
check("08:00 removed", !withBusy.some(s => s.start.toISOString() === "2026-01-05T08:00:00.000Z"));
check("08:30 removed (overlaps busy)", !withBusy.some(s => s.start.toISOString() === "2026-01-05T08:30:00.000Z"));
check("09:00 kept (after busy+buffer)", withBusy.some(s => s.start.toISOString() === "2026-01-05T09:00:00.000Z"));

console.log("\n5. Both durations offered");
const both = generateSlots({ ...base, minNoticeHours: 0, rules: [{ weekday: 1, start_minute: 540, end_minute: 720 }],
  durations: [25, 50], from, to: new Date("2026-01-06T00:00:00Z") });
check("has 25-min slots", both.some(s => s.durationMinutes === 25));
check("has 50-min slots", both.some(s => s.durationMinutes === 50));
check("sorted ascending", both.every((s,i) => i === 0 || both[i-1].start.getTime() <= s.start.getTime()));

console.log("\n6. Spring-forward day (29 Mar 2026, Paris skips 02:00→03:00)");
const dst = generateSlots({ ...base, minNoticeHours: 0, rules: [{ weekday: 0, start_minute: 540, end_minute: 720 }],
  durations: [50], from: new Date("2026-03-29T00:00:00Z"), to: new Date("2026-03-30T00:00:00Z") });
console.log("     " + dst.map(s => s.start.toISOString().slice(11,16)).join(", "));
check("Sunday 09:00 Paris = 07:00Z (summer time)", dst[0]?.start.toISOString() === "2026-03-29T07:00:00.000Z", dst[0]?.start.toISOString());
check("no duplicate starts", new Set(dst.map(s=>s.start.getTime())).size === dst.length);

console.log("\n7. isSlotBookable rejects what generateSlots never offered");
const good = new Date("2026-01-05T09:00:00Z");
const bad  = new Date("2026-01-05T13:00:00Z"); // outside the block
const opts = { ...base, minNoticeHours: 0, rules: [{ weekday: 1, start_minute: 540, end_minute: 720 }], now: from };
check("accepts a real slot", isSlotBookable(good, 50, opts));
check("rejects out-of-hours slot", !isSlotBookable(bad, 50, opts));
check("rejects off-grid start (09:07)", !isSlotBookable(new Date("2026-01-05T09:07:00Z"), 50, opts));
check("rejects when busy", !isSlotBookable(good, 50, { ...opts, busy: [{ start: good, end: new Date(good.getTime()+50*60000) }] }));

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
