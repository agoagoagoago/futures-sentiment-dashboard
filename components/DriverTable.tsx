import type { Driver } from "@/lib/types";
import { impactBadge } from "@/lib/scoring";

/** Table of market drivers: driver / category / impact / strength / evidence / horizon / source. */
export default function DriverTable({ drivers }: { drivers: Driver[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-sm">
        <thead className="bg-zinc-900/60 text-zinc-400 text-xs uppercase tracking-wider">
          <tr>
            <th className="text-left font-medium px-3 py-2">Driver</th>
            <th className="text-left font-medium px-3 py-2">Category</th>
            <th className="text-left font-medium px-3 py-2">Impact</th>
            <th className="text-left font-medium px-3 py-2">Strength</th>
            <th className="text-left font-medium px-3 py-2">Evidence</th>
            <th className="text-left font-medium px-3 py-2">Horizon</th>
            <th className="text-left font-medium px-3 py-2">Source</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {drivers.map((d) => (
            <tr key={d.driver} className="align-top hover:bg-zinc-900/30">
              <td className="px-3 py-2 font-medium text-zinc-200">{d.driver}</td>
              <td className="px-3 py-2 text-zinc-400">{d.category}</td>
              <td className="px-3 py-2">
                <span className={`rounded px-1.5 py-0.5 text-xs ${impactBadge(d.directionalImpact)}`}>
                  {d.directionalImpact}
                </span>
              </td>
              <td className="px-3 py-2 text-zinc-400">{d.strength}</td>
              <td className="px-3 py-2 text-zinc-400 max-w-xs">{d.evidence}</td>
              <td className="px-3 py-2 text-zinc-400 whitespace-nowrap">{d.timeHorizon}</td>
              <td className="px-3 py-2">
                {d.sourceUrl ? (
                  <a
                    href={d.sourceUrl}
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
