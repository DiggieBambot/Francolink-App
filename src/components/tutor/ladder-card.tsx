// Where a listed tutor stands on the pay ladder.
//
// This exists because a ladder nobody can see is not an incentive. The steps
// and the promotion thresholds are deliberately public (see
// 20260828_tutor_ladder.sql) — the whole point is that a tutor can work out
// what to do next and roughly when they'll get there.
//
// What is NOT shown, on purpose, is what the student paid. That is the other
// side of the booking and it belongs to them; the view the app reads masks it
// away (20260826_pay_visibility.sql).

import { Award, TrendingUp, Star, Repeat, ShieldCheck } from "lucide-react";

interface Standing {
  tier: string | null;
  metrics: {
    completed: number;
    reliability_bps: number;
    rebooking_bps: number;
    avg_rating: number;
    rated_count: number;
  };
  step: number;
  pay_cents_50: number | null;
  next_step: {
    step: number;
    pay_cents_50: number;
    lessons_to_go: number;
    needs_reliability_bps: number;
    needs_rating: number;
  } | null;
  promotion: {
    to_tier: string;
    lessons_to_go: number;
    needs_reliability_bps: number;
    needs_rebooking_bps: number;
    needs_rating: number;
    eligible: boolean;
  } | null;
}

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100
  );

const pct = (bps: number) => `${(bps / 100).toFixed(0)}%`;

const TIER_LABEL: Record<string, string> = {
  community: "Community",
  certified: "Certified",
  professional: "Professional",
};

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Star;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/70 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-lg font-bold text-slate-900">{value}</div>
    </div>
  );
}

export function TutorLadderCard({ standing }: { standing: Standing }) {
  const { metrics: m, next_step: next, promotion: promo } = standing;

  return (
    <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 to-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary-700">
            <Award className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Your pay ladder
            </span>
          </div>
          <h2 className="mt-2 text-lg font-bold text-slate-900">
            {TIER_LABEL[standing.tier ?? ""] ?? "Tutor"} · step {standing.step}
          </h2>
          {standing.pay_cents_50 != null && (
            <p className="mt-1 text-sm text-slate-600">
              You earn{" "}
              <strong className="text-slate-900">
                {money(standing.pay_cents_50)}
              </strong>{" "}
              per 50-minute lesson, plus{" "}
              {money(Math.round(standing.pay_cents_50 / 2))} for a 25-minute one.
            </p>
          )}
        </div>

        {promo?.eligible && (
          <span className="shrink-0 rounded-xl bg-success-light px-4 py-2.5 text-sm font-bold text-green-800">
            Ready for {TIER_LABEL[promo.to_tier] ?? promo.to_tier}
          </span>
        )}
      </div>

      {/* Where they actually stand today. */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric icon={TrendingUp} label="Lessons" value={String(m.completed)} />
        <Metric
          icon={ShieldCheck}
          label="Reliability"
          value={pct(m.reliability_bps)}
        />
        <Metric icon={Repeat} label="Rebooking" value={pct(m.rebooking_bps)} />
        <Metric
          icon={Star}
          label="Rating"
          // A rating built on two reviews is not a rating. Say so rather than
          // showing a number that will swing wildly.
          value={m.rated_count >= 5 ? m.avg_rating.toFixed(1) : "—"}
        />
      </div>

      {/* The next rung, stated as a distance rather than a threshold — "18
          lessons to go" is actionable in a way that "150 lessons" is not. */}
      {next && (
        <div className="mt-4 rounded-xl border border-primary-100 bg-white p-4">
          <p className="text-sm text-slate-700">
            <strong className="text-slate-900">
              Step {next.step} pays {money(next.pay_cents_50)}
            </strong>{" "}
            per 50-minute lesson.{" "}
            {next.lessons_to_go > 0 ? (
              <>
                {next.lessons_to_go} more{" "}
                {next.lessons_to_go === 1 ? "lesson" : "lessons"} to go
                {next.needs_reliability_bps > 0 && (
                  <>, keeping reliability at {pct(next.needs_reliability_bps)}+</>
                )}
                {Number(next.needs_rating) > 0 && (
                  <> and a {Number(next.needs_rating).toFixed(1)}+ rating</>
                )}
                .
              </>
            ) : (
              <>
                You&apos;ve taught enough lessons — hold{" "}
                {pct(next.needs_reliability_bps)} reliability
                {Number(next.needs_rating) > 0 && (
                  <> and a {Number(next.needs_rating).toFixed(1)}+ rating</>
                )}{" "}
                to reach it.
              </>
            )}
          </p>
        </div>
      )}

      {/* Promotion. The big one: community → professional roughly doubles pay,
          so it gets said in full rather than buried. */}
      {promo && !promo.eligible && (
        <div className="mt-3 rounded-xl border border-secondary-200 bg-secondary-50 p-4">
          <p className="text-sm text-slate-700">
            <strong className="text-slate-900">
              {TIER_LABEL[promo.to_tier] ?? promo.to_tier} tutors earn
              considerably more per lesson.
            </strong>{" "}
            To be considered you need{" "}
            {promo.lessons_to_go > 0 ? (
              <>{promo.lessons_to_go} more lessons, </>
            ) : null}
            {pct(promo.needs_reliability_bps)} reliability,{" "}
            {pct(promo.needs_rebooking_bps)} of students rebooking, and a{" "}
            {Number(promo.needs_rating).toFixed(1)}+ rating. Meeting these makes
            you eligible — a person reviews every promotion.
          </p>
        </div>
      )}
    </div>
  );
}
