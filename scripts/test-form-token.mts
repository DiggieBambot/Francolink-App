import { issueFormToken, verifyFormToken, looksHuman } from "../src/lib/site/form-token";

let pass = 0, fail = 0;
const check = (n: string, c: boolean, x = "") => {
  if (c) { pass++; console.log("  ok   " + n); }
  else { fail++; console.log("  FAIL " + n + (x ? "  → " + x : "")); }
};

const now = Date.now();

console.log("\nrejects what bots send");
check("no token at all",        verifyFormToken(undefined) === "missing");
check("empty string",           verifyFormToken("") === "missing");
check("random junk",            verifyFormToken("abc123") === "malformed");
check("forged signature",       verifyFormToken(`${now - 5000}.deadbeef`) === "bad-signature");
check("tampered timestamp",     verifyFormToken(issueFormToken(now - 5000).replace(/^\d+/, String(now))) === "bad-signature");

console.log("\nrejects non-human timing");
check("submitted instantly",    verifyFormToken(issueFormToken(now), now) === "too-fast");
check("token older than 2h",    verifyFormToken(issueFormToken(now - 3 * 60 * 60 * 1000), now) === "expired");

console.log("\naccepts a real submission");
const real = issueFormToken(now - 30_000);
check("30s after render",       verifyFormToken(real, now) === "ok");
check("looksHuman agrees",      looksHuman(real, now) === true);
check("looksHuman rejects junk", looksHuman("abc123", now) === false);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
