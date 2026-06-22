import type { Narrative } from "@/lib/types";
import { impactBadge } from "@/lib/scoring";

/** Single narrative: name, implication, evidence, confirm/invalidate, horizon. */
export default function NarrativeCard({ narrative }: { narrative: Narrative }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-zinc-100">{narrative.name}</h3>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs ${impactBadge(narrative.implication)}`}>
          {narrative.implication}
        </span>
      </div>
      <p className="text-sm text-zinc-400">{narrative.summary}</p>
      <dl className="grid grid-cols-1 gap-2 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Evidence</dt>
          <dd className="text-zinc-300">{narrative.evidence}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-emerald-400/70">
            Confirms it
          </dt>
          <dd className="text-zinc-300">{narrative.confirmation}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-rose-400/70">
            Invalidates it
          </dt>
          <dd className="text-zinc-300">{narrative.invalidation}</dd>
        </div>
      </dl>
      <div className="text-xs text-zinc-500">Horizon: {narrative.timeHorizon}</div>
    </div>
  );
}
