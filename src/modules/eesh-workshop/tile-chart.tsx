import type { EeshInsights } from "./contracts";
import styles from "./eesh.module.css";

// Workshop tile art: one column per year, stacked by topic area (the three biggest areas in accent shades, the rest
// grey), so each subject's tile shows at a glance how its paper moved.
const SHADES = [88, 58, 34];
export function EeshTileChart({ insights }: { insights: EeshInsights }) {
  const years = insights.years, width = 240, height = 135, pad = 16, gap = 4;
  const bar = (width - pad * 2 - gap * (years.length - 1)) / years.length;
  const top = insights.domains.slice(0, 3).map(domain => domain.name);
  return <svg className={styles.tileChart} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${insights.label}: ${years[0]}–${years.at(-1)} оны сэдвийн оноо жилээр`}>
    {years.map((year, i) => {
      const x = pad + i * (bar + gap);
      let y = height - pad;
      const total = insights.domains.reduce((sum, domain) => sum + (domain.points[String(year)] ?? 0), 0) || 1;
      const parts = [...top.map((name, k) => ({ value: insights.domains.find(domain => domain.name === name)?.points[String(year)] ?? 0, shade: SHADES[k] })),
        { value: total - top.reduce((sum, name) => sum + (insights.domains.find(domain => domain.name === name)?.points[String(year)] ?? 0), 0), shade: 0 }];
      return <g key={year}>{parts.map((part, k) => {
        const h = (part.value / total) * (height - pad * 2);
        y -= h;
        return <rect key={k} x={x} y={y} width={bar} height={Math.max(0, h - 1.5)} rx={2}
          style={{ fill: part.shade ? `color-mix(in srgb, var(--wsp-accent) ${part.shade}%, var(--wsp-card))` : "var(--wsp-line-strong)" }} />;
      })}</g>;
    })}
  </svg>;
}
