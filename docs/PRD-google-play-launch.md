# FrancoLink — Google Play Store Launch PRD

**Owner:** Diggie Bambot
**Status:** Draft v1
**Created:** 2026-06-17
**Target platform:** Android (Google Play) via Trusted Web Activity (TWA)

---

## 1. Summary

FrancoLink is an existing Next.js 16 PWA (deployed on Vercel) for learning French,
Spanish, English, and German. It already has a web manifest, a service worker, web-push,
Supabase auth, and Stripe billing, and ~28 active users.

This PRD covers wrapping the existing PWA as a **Trusted Web Activity** and publishing it
to the Google Play Store with the minimum mandatory changes **plus** an app-native polish
pass — without rewriting the app in native code.

### Key decisions (locked)

| Decision | Choice | Implication |
|----------|--------|-------------|
| Monetization in app | **Web-only purchases** | App shows entitlement, never an in-app pay/upgrade CTA that leads to payment. Avoids Google's 15–30% cut. |
| Scope | **Polish + mandatory** | Ship the mandatory compliance gaps *and* app-native UX (bottom nav, offline page, push permission, splash). |
| Packaging | **PWABuilder** | Generate the signed `.aab` from the production URL; least tooling to learn for a first launch. |

### Non-goals (v1)

- No native Android codebase (Kotlin/Java/Flutter/React Native).
- No Google Play Billing integration (deferred; web-only billing for v1).
- No iOS / App Store (separate effort, different rules).
- No offline learning content beyond a graceful offline fallback page.

---

## 2. Background & rationale

The app is already a PWA, so a TWA is the lowest-effort, fully-Google-supported path to
Play. A TWA is a thin Android shell that renders the live production site full-screen with
no browser chrome, verified via Digital Asset Links. The web app remains the single source
of truth; the Android app is just a distribution channel.

**Why web-only billing:** Google Play takes 15–30% of in-app digital purchases and mandates
Google Play Billing for digital goods *purchased inside the app*. By keeping all
subscription purchases on the website (outside the app surface), we avoid the cut. The
trade-off and its rules are detailed in §6.

---

## 3. Success criteria

- App approved and live on production track in Google Play.
- TWA launches with **no browser address bar** (asset links verified).
- Lighthouse PWA installability passes; maskable icon renders correctly on Android.
- Closed test completed: ≥12 testers opted in for 14 continuous days (we have ~28 users).
- No policy rejections for: Data Safety mismatch, missing privacy policy, missing account
  deletion, or payment-policy violation.
- Existing users can sign in and use all current features inside the app.

---

## 4. Mandatory compliance work (gates — must ship)

These block store approval. None are optional.

### 4.1 Maskable icon
- **Problem:** every icon in `src/app/manifest.ts` is `purpose: "any"`. Android adaptive
  icons need a `maskable` variant with safe-zone padding, or the launcher icon is cropped.
- **Action:** produce a 512×512 maskable PNG (logo within the ~80% safe circle), add it to
  `/public/icons/`, and add an entry with `purpose: "maskable"` to the manifest icons array.
- **Owner:** code + design asset.

### 4.2 Digital Asset Links
- **Requirement:** serve `/.well-known/assetlinks.json` from the production domain,
  containing the SHA-256 fingerprint of the app signing key.
- **Action:** add a static route/file in the Next app. Fingerprint comes from PWABuilder /
  Play App Signing after the key is generated. Re-verify after any key change.
- **Gate:** wrong/missing fingerprint = browser URL bar shows = launch-blocking UX.

### 4.3 Privacy policy & terms
- **Requirement:** publicly hosted Privacy Policy URL (mandatory) and Terms.
- Must disclose collection of email, payment data (Stripe), usage data, and AI processing
  (OpenAI), plus all third-party processors (Supabase, Stripe, OpenAI, Vercel).
- **Action:** add `/privacy` and `/terms` pages; reference the privacy URL in Play Console.

### 4.4 Account & data deletion
- **Requirement:** Google requires an in-app path **and** a web-accessible path to delete
  the account and associated data when in-app sign-up exists.
- **Action:** build a "Delete account" flow (Supabase user + related rows + Stripe customer
  cleanup) reachable from Profile, and a public web URL for the same.

### 4.5 Data Safety form
- **Requirement:** self-declared data collection/sharing form in Play Console. Must exactly
  match the privacy policy and actual code, or rejection follows.
- **Action:** complete after privacy policy is final; audit endpoints for what is actually
  collected/shared.

### 4.6 Payments policy compliance (web-only model)
- The app must **not** present any in-app UI that leads to a digital-goods payment
  (no "Subscribe", "Upgrade", "Buy premium" buttons that open Stripe checkout inside the
  app surface).
- Premium state is reflected (locked/unlocked features) but purchasing happens on the
  website outside the app. See §6 for the exact rules and risks.

### 4.7 Content rating & target audience
- Complete the content-rating questionnaire (category: Education).
- Declare target audience. **Avoid declaring under-13** unless intended — it triggers
  Families Policy + COPPA obligations (much stricter).

---

## 5. App-native polish work (in scope)

Beyond the gates, these make it feel like an app, not a wrapped page.

### 5.1 Safe areas / notches
- Add `viewport-fit=cover` and `env(safe-area-inset-*)` padding so headers/footers clear
  the status bar and gesture pill.

### 5.2 Bottom navigation
- App-style bottom nav (Home / Learn / Speak / Profile) for primary destinations, matching
  the mockup. Themed with `#1e3a5f`.

### 5.3 Push notification permission flow
- Android 13+ requires a runtime notification permission prompt. Trigger it from the
  existing web-push flow at an appropriate moment (not cold on first launch).

### 5.4 Offline fallback
- `public/sw.js` currently caches only `/`. Add a friendly branded offline page instead of
  a blank screen when there's no connection.

### 5.5 Splash screen & status bar
- Provide a clean icon + background color so PWABuilder generates a correct splash.
- Confirm `theme_color: #1e3a5f` drives the Android status bar in light/dark.

### 5.6 Navigation & external links
- Verify Android back/gesture works through modals and the `tldraw` canvas (no traps).
- Ensure auth/OAuth and any external redirects stay in-scope or are handled gracefully so
  users aren't bounced out of the app mid-flow (see §7).

### 5.7 Store listing screenshots
- Populate `pwa_screenshot_*` in `app_settings` (richer installability) and produce phone
  screenshots for the listing.

---

## 6. Monetization (web-only) — detail & risk

**Model:** all subscription purchases happen on the website. The Android app reflects
entitlement only.

**Hard rules to stay compliant:**
- No in-app buttons/links that initiate or route to digital-goods payment.
- Premium-gated features can show a locked state, but the unlock action must not be an
  in-app purchase CTA.
- Do not deep-link from the app to a Stripe checkout for digital goods.

**Risk:** Google has tightened "anti-steering" enforcement. A locked feature that nudges
toward buying on the web can be interpreted as circumventing Play Billing. Keep messaging
neutral ("This feature is part of Premium") and avoid pricing/CTA inside the app.

**Migration path (future):** if rejected or to capture Android purchasers, integrate Google
Play Billing via the Digital Goods API in the TWA. Tracked as a v2 item.

---

## 7. Security & infrastructure

- **Asset links correctness** — single source of the "no URL bar" guarantee; re-verify on
  any key rotation.
- **Signing key** — use **Google Play App Signing** (Google holds the app key); securely
  back up the *upload* key. Losing it is painful.
- **Supabase redirect allow-list** — add the app origin / TWA referrer to allowed redirect
  URLs or social/OAuth login breaks inside the app.
- **Secret hygiene** — confirm `.env.local` is gitignored; ensure no Supabase service-role
  key or server secret ships to the client bundle. Explicit audit before wider distribution.
- **Rate limiting** — add/verify limits on OpenAI-backed routes; store distribution raises
  traffic and abuse surface.
- **CSP/CORS** — if tightening CSP, ensure manifest, service worker, and
  `/.well-known/assetlinks.json` are not blocked.

---

## 8. Google Play account & process

- **Developer registration:** $25 one-time fee.
- **Identity verification:** mandatory — government ID (personal) or D-U-N-S (organization).
  Start this **first**; it's the long pole (1–3 days). Tied to real identity, so policy bans
  follow the person.
- **Closed testing requirement:** new personal accounts must run a closed test with **≥12
  testers opted in for 14 continuous days** before promoting to production.
  - We have ~28 users → pre-screen for Android, opt in **15–18** to absorb dropouts.
  - Testers must use the Google account on their Android phone; manage via a Google Group.
  - Do **not** fake testers with bots/emulators — Play Integrity + account signals detect it;
    penalty is app removal or account termination.
- **Review:** each release reviewed (hours to a few days).

---

## 9. Store listing assets

- App icon 512×512; maskable variant (see §4.1).
- Feature graphic 1024×500.
- Phone screenshots (4–8 recommended).
- Short description (≤80 chars) + full description.
- Category: Education. Content rating questionnaire. Target audience.
- Privacy policy URL (from §4.3).

---

## 10. Sequenced plan

1. **Start Play Console identity verification** (slowest; do today).
2. **Pre-screen the 28 users** for Android; assemble tester Google Group.
3. **Code/compliance gates:** maskable icon, assetlinks route, `/privacy` + `/terms`,
   account deletion, safe-area CSS.
4. **Polish:** bottom nav, offline page, push permission flow, splash, screenshots.
5. **Generate package with PWABuilder**; deploy `assetlinks.json`; verify no URL bar.
6. **Internal test → closed test** with 15–18 testers for 14 continuous days.
7. **Complete Data Safety + content rating**, upload listing assets.
8. **Submit for production review.**

---

## 11. Open items / decisions deferred

- Google Play Billing integration (v2, if web-only proves too restrictive).
- iOS / App Store launch (separate PRD).
- Deeper offline learning content.
- Whether to register as personal vs. organization developer (affects verification + the
  12-tester rule).
