// Dependency-free daily bar chart for the growth dashboard (SSR, no client JS).

export function BarSeries({ data, color }: { data: { date: string; count: number }[]; color: string }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <div className="flex h-28 items-end gap-[3px]">
        {data.map((d) => (
          <div key={d.date} className="group relative flex-1" title={`${d.date}: ${d.count}`}>
            <div
              className={`w-full rounded-sm ${color} transition-opacity group-hover:opacity-80`}
              style={{ height: `${Math.max(2, (d.count / max) * 100)}%` }}
            />
            <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-1.5 py-0.5 text-[10px] font-semibold text-white group-hover:block">
              {d.count}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-gray-400">
        <span>{data[0]?.date.slice(5)}</span>
        <span className="font-semibold text-gray-600">{total} total</span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}
