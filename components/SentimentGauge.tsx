import type { Bias, Confidence } from "@/lib/types";
import { biasColor, clamp } from "@/lib/scoring";

interface Props {
  score: number;
  bias: Bias;
  confidence: Confidence;
  size?: number;
}

/**
 * Static SVG semicircular gauge for a -100..+100 sentiment score.
 * Server-rendered (no client JS). The needle angle maps -100 -> left,
 * +100 -> right.
 */
export default function SentimentGauge({
  score,
  bias,
  confidence,
  size = 220,
}: Props) {
  const s = clamp(score, -100, 100);
  const w = size;
  const h = size / 2 + 24;
  const cx = w / 2;
  const cy = size / 2;
  const r = size / 2 - 12;

  // Map score [-100,100] to angle [180deg (left), 0deg (right)].
  const angleDeg = 180 - ((s + 100) / 200) * 180;
  const angleRad = (angleDeg * Math.PI) / 180;
  const needleX = cx + r * 0.82 * Math.cos(angleRad);
  const needleY = cy - r * 0.82 * Math.sin(angleRad);

  // Colored arc bands (left=bearish red, mid=neutral, right=bullish green).
  const arc = (startDeg: number, endDeg: number, color: string) => {
    const s1 = (startDeg * Math.PI) / 180;
    const e1 = (endDeg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(s1);
    const y1 = cy - r * Math.sin(s1);
    const x2 = cx + r * Math.cos(e1);
    const y2 = cy - r * Math.sin(e1);
    const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    return (
      <path
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
        fill="none"
        stroke={color}
        strokeWidth={12}
        strokeLinecap="round"
      />
    );
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Sentiment score ${s}`}>
        {/* bearish (180->120), neutral (120->60), bullish (60->0) */}
        {arc(180, 120, "#f43f5e")}
        {arc(120, 60, "#71717a")}
        {arc(60, 0, "#10b981")}
        {/* needle */}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#e4e4e7" strokeWidth={3} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={5} fill="#e4e4e7" />
      </svg>
      <div className="-mt-6 text-center">
        <div className={`text-4xl font-bold tabular-nums ${biasColor(bias)}`}>
          {s > 0 ? `+${s}` : s}
        </div>
        <div className={`text-sm font-medium ${biasColor(bias)}`}>{bias}</div>
        <div className="text-xs text-zinc-500 mt-1">
          Confidence: <span className="text-zinc-300">{confidence}</span> · scale −100 to +100
        </div>
      </div>
    </div>
  );
}
