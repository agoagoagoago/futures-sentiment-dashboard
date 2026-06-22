import type { Catalyst } from "@/lib/types";

/** Upcoming catalysts with why-it-matters and bull/bear scenarios. */
export default function CatalystCalendar({ catalysts }: { catalysts: Catalyst[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-sm">
        <thead className="bg-zinc-900/60 text-zinc-400 text-xs uppercase tracking-wider">
          <tr>
            <th className="text-left font-medium px-3 py-2 whitespace-nowrap">Date</th>
            <th className="text-left font-medium px-3 py-2">Catalyst</th>
            <th className="text-left font-medium px-3 py-2">Why it matters</th>
            <th className="text-left font-medium px-3 py-2">Bullish</th>
            <th className="text-left font-medium px-3 py-2">Bearish</th>
            <th className="text-left font-medium px-3 py-2">Source</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {catalysts.map((c) => (
            <tr key={c.event} className="align-top hover:bg-zinc-900/30">
              <td className="px-3 py-2 font-mono text-xs text-zinc-400 whitespace-nowrap">{c.date}</td>
              <td className="px-3 py-2 font-medium text-zinc-200">{c.event}</td>
              <td className="px-3 py-2 text-zinc-400 max-w-xs">{c.whyItMatters}</td>
              <td className="px-3 py-2 text-emerald-300/90">{c.bullishScenario}</td>
              <td className="px-3 py-2 text-rose-300/90">{c.bearishScenario}</td>
              <td className="px-3 py-2">
                {c.sourceUrl ? (
                  <a
                    href={c.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:text-sky-300"
                  >
                    link
                  </a>
                ) : (
                  <span className="text-zinc-600">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
