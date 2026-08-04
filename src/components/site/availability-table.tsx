import { CalendarX } from "lucide-react";
import type { AvailabilitySlot } from "@/lib/site/queries";
import { WEEKDAY_LABEL, formatMinute } from "@/lib/site/format";

/**
 * A tutor's recurring weekly hours. Times are stored and shown in the tutor's
 * own timezone — converting to the visitor's zone would require a client
 * component and would be wrong for crawlers, so we label the zone instead.
 */
export function AvailabilityTable({
  slots,
  timezone,
}: {
  slots: AvailabilitySlot[];
  timezone: string | null;
}) {
  if (slots.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 text-center">
        <CalendarX className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">
          This tutor arranges times directly with each student — message them
          after you join to agree a slot.
        </p>
      </div>
    );
  }

  // Monday-first reading order; the stored weekday is JS-style (0 = Sunday).
  const order = [1, 2, 3, 4, 5, 6, 0];

  return (
    <div>
      <div className="rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
        {order.map((weekday) => {
          const day = slots.filter((s) => s.weekday === weekday);
          return (
            <div
              key={weekday}
              className="flex items-center gap-4 px-5 py-3.5 bg-white"
            >
              <span className="w-28 shrink-0 font-heading font-bold text-sm text-primary">
                {WEEKDAY_LABEL[weekday]}
              </span>
              {day.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {day.map((s, i) => (
                    <span
                      key={`${s.start_minute}-${i}`}
                      className="px-3 py-1 rounded-lg bg-success-light text-green-800 text-sm font-semibold tabular-nums"
                    >
                      {formatMinute(s.start_minute)}–{formatMinute(s.end_minute)}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-gray-400">Unavailable</span>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Times shown in the tutor&apos;s local timezone
        {timezone ? ` (${timezone})` : ""}. Exact slots are confirmed with the
        tutor once you join their class.
      </p>
    </div>
  );
}
