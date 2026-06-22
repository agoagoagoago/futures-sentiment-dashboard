import type { Risk } from "@/lib/types";
import { impactBadge } from "@/lib/scoring";

/** Panel listing the biggest risks to the current narrative. */
export default function RiskPanel({ risks }: { risks: Risk[] }) {
  return (
    <ul className="space-y-2">
      {risks.map((r) => (
        <li
          key={r.risk}
          className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 flex items-start gap-3"
        >
          <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs ${impactBadge(r.impact)}`}>
            {r.impact}
          </span>
          <div>
            <div className="font-medium text-zinc-200 text-sm">{r.risk}</div>
            <div className="text-sm text-zinc-400">{r.description}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}
