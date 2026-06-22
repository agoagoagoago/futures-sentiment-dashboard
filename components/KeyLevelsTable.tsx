import type { TechnicalContext } from "@/lib/types";

interface Row {
  level: string;
  type: string;
  note: string;
}

/**
 * Renders upside (resistance) and downside (support) levels plus invalidation
 * from the technical context. Levels may be placeholders pending live price.
 */
export default function KeyLevelsTable({ tech }: { tech: TechnicalContext }) {
  const rows: Row[] = [
    ...tech.resistanceLevels.map((l) => ({
      level: String(l),
      type: "Resistance (upside)",
      note: "Break + hold confirms upside continuation",
    })),
    ...tech.supportLevels.map((l) => ({
      level: String(l),
      type: "Support (downside)",
      note: "Loss on a closing basis opens further downside",
    })),
    ...tech.invalidationLevels.map((l) => ({
      level: String(l),
      type: "Invalidation",
      note: "Close beyond this flips the near-term view",
    })),
  ];

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-sm">
        <thead className="bg-zinc-900/60 text-zinc-400 text-xs uppercase tracking-wider">
          <tr>
            <th className="text-left font-medium px-3 py-2">Level</th>
            <th className="text-left font-medium px-3 py-2">Type</th>
            <th className="text-left font-medium px-3 py-2">Reason / use</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {rows.map((r, i) => (
            <tr key={`${r.type}-${i}`} className="hover:bg-zinc-900/30">
              <td className="px-3 py-2 font-mono text-zinc-200">{r.level}</td>
              <td className="px-3 py-2 text-zinc-400">{r.type}</td>
              <td className="px-3 py-2 text-zinc-400">{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
