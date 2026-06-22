import type { Source } from "@/lib/types";

/** Linked list of source citations. */
export default function SourceList({ sources }: { sources: Source[] }) {
  return (
    <ul className="space-y-1.5 text-sm">
      {sources.map((s) => (
        <li key={s.url} className="flex flex-wrap items-baseline gap-x-2">
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:text-sky-300 font-medium"
          >
            {s.title}
          </a>
          <span className="text-zinc-500">— {s.publisher}</span>
          <span className="text-zinc-600 text-xs">({s.date})</span>
        </li>
      ))}
    </ul>
  );
}
