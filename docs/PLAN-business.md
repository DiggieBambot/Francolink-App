# FrancoLink for Business — plan (self-study only)

Status: **Phase 0 built (§4); prices still draft.** Written 2026-11-16, revised the same day.
Scope: selling **self-study access** (the Premium lesson library, audio,
placement test, progress tracking, homework) to organisations: employers,
agencies, schools and teachers. Outreach is direct. **No paid ads.**

**Out of scope:** live classes, tutor lessons, cohorts and lesson packs for
businesses. Those will get their own plan later. Nothing here depends on tutor
supply.

---

## 1. What already exists (audit, 2026-11-16)

### Already there and reusable

| Asset | Where | Why it matters for B2B |
|---|---|---|
| "Franco Link for Teams" block on the homepage | `src/app/[locale]/page.tsx:295`, copy in `landing.corporate_*` | The only business-facing surface. Its CTA goes to the generic `/contact` form. |
| Contact form → `contact_messages` + email to support | `src/components/site/contact-form.tsx`, `src/app/api/site/contact/route.ts` | Inbound capture works, but there's no "Teams / schools" topic and no company or headcount fields. |
| Self-study entitlement check | `src/lib/access.ts` | Access depends on `subscription_plan` plus `subscription_ends_at`. A business seat can just set those two fields, so no new entitlement logic is needed for the first customers. |
| Class codes, student list, assigned homework | `(tutor)` routes, `tutor_students`, `homework_*` | Already works as a **teacher's classroom tool** for self-study: assign lessons and homework, see who did them. |
| Placement test, streaks, progress, analytics events | `/admin/growth`, `user_activity` | The raw data a manager progress report would be built from. |
| Outreach log with tracked links (utm_content → signup attribution) | `/admin/outreach`, `outreach_reports` | Ready-made outreach tracker. Its channel list has `linkedin` and `other` but **no `email`**. |
| Creator affiliate program (20% × 12 months on self-study subs, 5% customer code, manual payouts) | `/api/affiliates/*` | Already covers self-study only, so it works as an **agency referral programme** with no build. |
| TCF Canada guides | `src/app/site/guides` | Strongest content hook for immigration agencies and Canada-bound employees. |

### Missing or wrong

1. **Tutor-linked free self-study: decided and already true (2026-11-16).** Students get free self-study only through live bookings, which in practice means an active paid lesson plan. That plan sets `subscription_plan = PREMIUM_PLUS` and resets it to `FREE` when it ends (`src/lib/credits/subscription.ts`). Linking to a tutor by class code grants nothing. The opposite rule existed only in `src/lib/access.ts`, which nothing called, and that file has been deleted. So teachers, schools and agencies **can't** get free Premium for a class by signing up as a tutor, and seat sales are protected.
2. **The homepage promises features that don't exist.** "Progress tracking & reporting for managers", "Custom curriculum for your industry" and "Volume pricing available" aren't built or priced. The block also implies live sessions.
3. **"Maria L., Corporate Learner at Shopify" testimonial** (added in the 2026-02-21 UI polish commit) looks like a placeholder, and it mentions live sessions. If it isn't a real person, remove it before contacting companies.
4. **No organisation model.** There are no orgs, seats, team admin, bulk invites or org-level billing.
5. **No admin tool to grant Premium manually.** Nothing in `src/app/api/admin/*` sets `subscription_plan` or `subscription_ends_at`, so a pilot needs a SQL edit.
6. **No business landing page**, one-pager, pricing sheet or case study.

---

## 2. Who we sell to, in priority order

| # | Segment | Buyer | Their pain | What we sell | Sales cycle |
|---|---|---|---|---|---|
| 1 | **Immigration and relocation agencies** (Canadian RCICs, Express Entry / Francophone Mobility consultants, relocation firms, study-abroad agents) | Owner / partner | Clients need a TCF/TEF score fast. French points can decide the application. | Referral partnership or bulk access codes, positioned as TCF prep | **Days to weeks.** Owner decides. |
| 2 | **Employers with a French need** (bilingual Canadian roles, firms with francophone clients, staff moving to France, Belgium, Quebec or francophone Africa) | HR / L&D manager, or the CEO at an SME | Staff need working French. Classroom courses are expensive and hard to schedule. | Team seats with a manager progress report | 3–8 weeks |
| 3 | **Independent French teachers and tutors** | The teacher | Need ready-made lessons and homework for their students | Classroom licence (seats for their students) and a free teacher account | Days |
| 4 | **Language schools, K-12, colleges** | Director / head of languages | Homework, self-study material, progress tracking | Site licence | **Slow.** Budget follows the school term (decide in spring for September, in November for January). |

**Recommendation: lead with agencies and run employers alongside them.**
Agencies say yes fastest, have the most urgent need (a test score with a
deadline), and the TCF content already exists. Employers give bigger seat
counts but take longer. Teachers are fast but small, and depend on the §1.1
decision. Treat schools as a planted seed for the September 2027 intake.

---

## 3. Offers and pricing

### The principle

Self-study costs almost nothing per extra learner (TTS audio is cached, content
is already built), so **seat discounts are close to pure margin**, unlike live
lessons. That lets us discount generously for volume and still win.

Consumer reference prices: Premium $7.99/mo or $59.99/yr on the web, $8.99 or
$69.99 in the Play app. Premium+ ($14.99/mo) mainly adds AI tutor messages,
which are currently switched off, so **business seats are Premium**.

### 3.1 Team seats (employers)

Per learner, billed annually by invoice:

| Seats | Price / seat / year | Equivalent / month |
|---|---|---|
| 5–49 | **$79** | $6.58 |
| 50–199 | **$59** | $4.92 |
| 200+ | quote (floor ~$35) | — |

Includes Premium for each learner, the placement test at start and every
quarter, a **manager progress report** (who's active, lessons done, level
moved), one invoice, and reassigning a seat when someone leaves. The price sits
above consumer annual for small teams because they're paying for admin,
reporting and invoicing. **Minimum order: 5 seats ($395).**

Optional packaging, at the same price with a different label:
- **"Workplace French"**: an A1→B1 learning path.
- **"TCF/TEF Canada track"**: the exam-prep path for Canada-bound staff.

### 3.2 Agencies: partner programme

The partner picks one:

| Option | How it works | Build |
|---|---|---|
| **Referral partner** | Partner shares their code. Their clients get 5% off and the partner earns 20% of self-study payments for 12 months. | None. Existing affiliate system. |
| **Bulk access codes** | Partner buys 12-month Premium codes in packs of 10 at **$36 each** (40% off $59.99) and includes them in their own TCF prep or relocation package at any price. | Voucher/redeem codes (Phase 2). Use manual grants until then. |

Volume steps for codes: 10–49 at $36, 50+ at $30.

Also offer a **10% finder's fee on the first-year value of any team-seat deal a
partner introduces**, so HR consultants and relocation firms pass on leads.

### 3.3 Teachers: classroom licence

- Teacher account: **free** (class code, assign lessons and homework, see completion).
- Student seats: **$20 per student per year, minimum 10 ($200)**, or the teacher refers students individually and earns the standard commission.
- Students linked to a teacher by class code stay on Free unless they buy Premium, get a seat, or have a live lesson plan (§1.1).

### 3.4 Schools: site licence

**$15 per student per year, minimum 30 students ($450).** Teacher accounts are
free. If students are under 16, check parental consent (GDPR Art. 8 / COPPA)
before selling. The platform rule that students create their own accounts
already helps here.

### 3.5 Launch offers (time-boxed)

- **Free 30-day pilot** for up to 10 learners. At day 25 the buyer gets a usage report and a quote.
- **Founding customer price:** 30% off year one for the **first 10 organisations**, in return for a logo, a named quote and a short case study. That case study replaces the placeholder testimonial.

### 3.6 Publish prices or not?

Publish the "from" prices on `/business`: "Team seats from $59/learner/year;
schools from $15/student/year". Without ads, the buyer has to be able to
forward a page with real numbers to whoever approves the budget. Keep agency
code prices on request.

---

## 4. What to build, and when

**Rule: don't build the org system before a buyer says yes.** Provision the
first three customers by hand.

### Phase 0: sell-ready (about week 1)

> **Built 2026-11-16 on `feat/business-phase0`** (not yet merged or deployed):
> `/business` page (prices in `src/lib/site/business.ts`); the homepage Teams
> block was rewritten and now points there; the Shopify testimonial is gone;
> the contact form has a "Teams, schools & partners" topic with organisation and
> learner-count fields; `/admin/premium-grants` grants Premium until a date and
> a daily job (`/api/cron/expire-grants`) ends it; `email` is now an outreach
> channel; `docs/business/one-pager.pdf` exists. Also fixed: the admin user
> page's "Set as Premium" menu was posting to a URL that 404'd.
> Still manual: Stripe Invoicing, the booking link
> (`NEXT_PUBLIC_BUSINESS_BOOKING_URL`), and running the two 20261116 migrations.

1. ~~Decide the tutor-link loophole~~. Done: free self-study comes only with live bookings (§1.1).
2. `/business` page: offers, prices, FAQ, "Book a 20-min call" (Cal.com/Calendly), pilot sign-up form.
3. Point the homepage "For Teams" CTA at `/business`. Remove the claims that aren't built and the live-session wording.
4. Remove or replace the Shopify testimonial.
5. Contact form: add a "Teams, schools & partners" topic, plus company and number-of-learners fields.
6. **Admin "grant Premium until date" tool** (sets `subscription_plan` + `subscription_ends_at`, with a reason or org field). This is the smallest build that unblocks pilots. Make sure affiliate commission ignores granted seats.
7. Add `'email'` to the `outreach_reports.platform` check constraint.
8. One-page PDF and a pricing sheet. A business variant of the TCF Canada guide works as a lead magnet for agencies.
9. Stripe Invoicing for quotes and invoices. Nothing to build.

### Phase 1: on the first signed pilot

- `organizations` and `organization_members` tables: seat cap, entitlement end date, owner (manager) user.
- **Org join link or code.** Reuse the class-code pattern. Learners still create their own accounts (GDPR rule from `PROJECT-CONTEXT.md`).
- Add `active org membership` as a reason in `canAccessSelfStudy()`. Keep it separate from Stripe and Play subscriptions so they never overwrite each other.
- **Manager dashboard:** active learners, lessons done, minutes, streak, placement level at start vs now, CSV export. Built from `user_activity`.
- Mobile app: org members are already Premium through their account. The app must not show B2B prices (anti-steering).

### Phase 2: on demand

- Voucher codes for agency bulk packs (redeem on web and mobile).
- PDF progress report and certificate of level reached.
- Self-serve checkout for 5–49 seats.

---

## 5. Outreach strategy (no ads)

### 5.1 Channels, ranked

| # | Channel | Best for | Volume | Notes |
|---|---|---|---|---|
| 1 | **Warm network**: existing students, tutors, your own contacts | All segments | 1 email blast plus personal asks | Ask students: "Does your employer pay for training? Who handles that?" This is the highest conversion rate available. |
| 2 | **LinkedIn, founder-led** | HR, CEOs, agency owners | 15–20 connection requests per day; post 3× a week | Don't pitch in the connection request. Post about TCF prep, French at work and learner progress. |
| 3 | **Personal cold email** | Agencies, schools, SME CEOs | 30–40 per day per inbox, after warm-up | Use a **separate sending domain**, never `francolink.net`, which carries transactional mail. Warm it up for 2–3 weeks. Plain text, 3 touches. |
| 4 | **Partnerships and associations** | Agencies, employers | A few high-value contacts | Chambers of commerce, HR and L&D groups, immigration consultant communities, study-abroad fairs. |
| 5 | **Teacher communities** | Teachers, schools | Ongoing | Facebook groups and forums, already tracked in `/admin/outreach`. |

### 5.2 Compliance (cold outreach)

- **Canada (CASL), the strictest.** Email only addresses that are published conspicuously (a firm's website, the CICC register), and only about their professional role. Include your identity, a postal address and an unsubscribe in every message.
- **UK/EU (PECR/GDPR).** Corporate addresses are allowed under legitimate interest with an easy opt-out. Sole traders and partnerships count as individuals and need consent. Keep a legitimate-interest note on file.
- **US (CAN-SPAM).** A truthful subject line, a physical address and an opt-out.
- In every region, honour opt-outs immediately and keep a suppression list.

### 5.3 Where the lead lists come from

- RCICs: the public CICC register.
- Relocation and study-abroad agents: Google Business listings. The DataForSEO business listings tool in this workspace can pull them by city.
- HR / L&D: LinkedIn search by title at companies with French-language job posts or francophone offices.
- Schools and teachers: public school directories, teacher Facebook groups, tutor directories.

Keep one pipeline sheet: name, org, segment, channel, stage (contacted →
replied → call → pilot → paid → lost), next step and date. Also log each
contact in `/admin/outreach` so signups are attributed.

### 5.4 Message templates (short and personal; replace [brackets])

**Agency owner**
> Subject: TCF prep for your clients
>
> Hi [Name], I saw [firm] handles [Express Entry / Francophone Mobility] files.
> I run FrancoLink, a French self-study platform with structured TCF Canada
> prep: A1–B2 lessons, audio, placement test and progress tracking. Partners
> either earn 20% on clients they refer, or buy discounted 12-month access
> codes to include in their own packages.
> Worth a 15-minute call? — [you]

**HR / L&D**
> Subject: French for [team/role] at [Company]
>
> Hi [Name], [Company] is [hiring bilingual roles / expanding in Quebec /
> working with francophone clients]. FrancoLink gives each employee a
> structured French course they follow at their own pace, and gives you a
> progress report showing who's active and how far they've moved.
> From $59 per learner per year. We're offering a free 30-day pilot for up to
> 10 staff. Open to a 20-minute call? — [you]

**Teacher / head of languages**
> Subject: French homework and practice for [your students / School]
>
> Hi [Name], FrancoLink gives French teachers ready-made A1–B2 lessons with
> audio, auto-marked homework and progress tracking. Teacher accounts are
> free; student access is from $15 a year. Happy to set up a free pilot class
> for the rest of this term. Interested? — [you]

Follow-ups: day 3 (one line plus the one-pager), day 8 (a short result or
screenshot of the progress report), day 15 (break-up note).

### 5.5 Discovery call (20 min)

1. Who needs French, how many people, and by when? Is there a test or deadline?
2. What do they use now, and what does it cost?
3. Who approves the spend, and is there a budget?
4. Offer the pilot with a start date. Book the day-25 review on the call.

---

## 6. 90-day plan (2026-11-16 → 2027-02-14)

| Weeks | Focus | Output |
|---|---|---|
| 1–2 | Phase 0 (loophole decision, `/business`, grant tool). Set up and start warming the sending domain. Build lead lists (100 agencies, 100 employers, 50 schools and teachers). Email the warm network. | Sell-ready site, one-pager, pipeline sheet |
| 3–6 | Daily outreach: 20 LinkedIn + 30 email. Two posts a week. Approach schools for the January term. | 300+ contacts, 10+ calls, 3–5 pilots |
| 7–10 | Run pilots and hold day-25 reviews. Start the Phase 1 build once the first pilot signs. | First 2–3 paid orgs, first case study |
| 11–13 | Use the case study in outreach. Run 1 partner webinar ("TCF prep for your clients"). Approach schools for September 2027. | 4–6 paid orgs, 5 active partners |

### Targets (leading indicators first)

| Metric | 90-day target |
|---|---|
| Contacts reached | 400 |
| Reply rate | ≥10% (≈40 replies) |
| Discovery calls | 20 |
| Pilots started | 8 |
| Paying organisations | 4 |
| Paid seats (teams + schools + teachers) | 100 |
| Agency codes sold | 30 |
| Active referral partners | 5 |

Example revenue at target: 100 seats at about $70 on average ($7,000) + 30
agency codes at $36 ($1,080) ≈ **$8,000 in the first 90 days**, or about
$5,500–6,000 after founding-customer discounts.

**Link to the 1,000-subscriber goal (2027-03-10):** 130 business seats and
codes is about 13% of the target, from a handful of deals. B2B self-study is
the quickest volume channel that doesn't use ads.

---

## 7. Risks

- **Granting Premium for live lessons in new places.** If starter or private packs are ever given self-study as well, tie it to the credit lifetime, as lesson plans do, so it can't become a back door for whole classes.
- **Low usage leading to non-renewal.** Business seats renew only if the manager report shows activity. Send learners push reminders and a weekly digest, and check in with the manager at day 25 and day 60.
- **Promising features that don't exist.** Sell only what Phase 0/1 can deliver within 2 weeks of signing.
- **Domain reputation.** Never send cold email from `francolink.net`.
- **Custom curriculum requests.** Offer the existing learning paths. Charge for anything custom or decline it.
- **Mobile anti-steering.** The Play app must not mention B2B or web prices.

---

## 8. Decisions needed from you

1. ~~The tutor-link loophole~~. Decided 2026-11-16: free self-study only with live bookings.
2. **Starting geography:** Canada (TCF/immigration), UK/EU, or francophone Africa. This sets the compliance rules, lead lists and messaging.
3. **Approve the price points** in §3, or adjust them.
4. **Sending identity:** you personally, as founder (recommended), on which secondary domain?
