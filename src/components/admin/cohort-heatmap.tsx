// Retention cohort heatmap (SSR). Rows = signup week, columns = weeks since.

interface Cohort {
  week: string;
  size: number;
  retention: (number | null)[];
}

function cell(v: number | null) {
  if (v === null || v === undefined) return "bg-transparent text-transparent";
  if (v === 0) return "bg-gray-50 text-gray-400";
  if (v < 20) return "bg-primary-100 text-primary-800";
  if (v < 40) return "bg-primary-200 text-primary-900";
  if (v < 60) return "bg-primary-400 text-white";
  if (v < 80) return "bg-primary-600 text-white";
  return "bg-primary-800 text-white";
}

export function CohortHeatmap({ cohorts }: { cohorts: Cohort[] }) {
  if (cohorts.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">No cohort data yet — accrues as users return.</p>;
  }
  const maxWeeks = Math.max(...cohorts.map((c) => c.retention.length));

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-center text-xs">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left font-semibold text-gray-500">Cohort</th>
            <th className="px-2 py-1 font-semibold text-gray-500">Users</th>
            {Array.from({ length: maxWeeks }, (_, i) => (
              <th key={i} className="px-2 py-1 font-semibold text-gray-500">W{i}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((c) => (
            <tr key={c.week}>
              <td className="whitespace-nowrap px-2 py-1 text-left font-medium text-gray-700">{c.week}</td>
              <td className="px-2 py-1 font-semibold text-gray-900">{c.size}</td>
              {Array.from({ length: maxWeeks }, (_, i) => {
                const v = c.retention[i] ?? null;
                return (
                  <td key={i} className={`rounded px-2 py-1.5 font-semibold ${cell(v)}`}>
                    {v === null || v === undefined ? "" : `${v}%`}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
