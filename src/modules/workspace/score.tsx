// A small score ring; null means nothing was auto-graded (for example only Writing/Speaking).
export function ScoreRing({ percent, size = 44 }: { percent: number | null; size?: number }) {
  const r = 17, c = 2 * Math.PI * r;
  const value = percent ?? 0;
  const tone = percent === null ? "tone-none" : value >= 75 ? "tone-good" : value >= 50 ? "tone-mid" : "tone-low";
  return <span className={"wsp-ring " + tone} style={{ width: size, height: size }} role="img" aria-label={percent === null ? "Оноо хүлээгдэж байна" : `${value}%`}>
    <svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r={r} className="track" /><circle cx="20" cy="20" r={r} className="value" strokeDasharray={`${(value / 100) * c} ${c}`} transform="rotate(-90 20 20)" /></svg>
    <span aria-hidden="true">{percent === null ? "—" : value}</span>
  </span>;
}
