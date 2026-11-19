"use client";
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Icon } from "@/modules/workspace/icons";
import styles from "./dashboard.module.css";
import { mnDate } from "./dates";
import { ACTIVITY_KINDS, ACTIVITY_STEPS, cellLabel, type ActivityCell, type ActivityGrid } from "./activity";

const ROW_LABELS: Record<number, string> = { 0: "Да", 2: "Лх", 4: "Ба" };
const LEGEND = ["0", `${ACTIVITY_STEPS[0]}–${ACTIVITY_STEPS[1] - 1}`, `${ACTIVITY_STEPS[1]}–${ACTIVITY_STEPS[2] - 1}`, `${ACTIVITY_STEPS[2]}–${ACTIVITY_STEPS[3] - 1}`, `${ACTIVITY_STEPS[3]}+`];
type Spot = { column: number; row: number; x: number; y: number };

/** A year of daily activity, one square per day (Monday at the top), shaded by how many things the student did. */
export function ActivityHeatmap({ grid }: { grid: ActivityGrid }) {
  const wrap = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState<Spot | null>(null);
  // Phones show the latest weeks first.
  useEffect(() => { const box = scroller.current; if (box) box.scrollLeft = box.scrollWidth; }, []);

  const cell: ActivityCell | null = spot ? grid.weeks[spot.column]?.[spot.row] ?? null : null;
  function place(column: number, row: number) {
    const target = scroller.current?.querySelector<HTMLElement>(`[data-column="${column}"][data-row="${row}"]`);
    const box = wrap.current?.getBoundingClientRect();
    if (!target || !box) return;
    const rect = target.getBoundingClientRect();
    // Keep the label (at most 260px wide, centred on the square) inside the card.
    const half = Math.min(130, box.width / 2);
    const x = Math.min(box.width - half, Math.max(half, rect.left - box.left + rect.width / 2));
    setSpot({ column, row, x, y: rect.top - box.top });
  }
  function hover(event: MouseEvent<HTMLDivElement>) {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-column]");
    if (!target) return;
    place(Number(target.dataset.column), Number(target.dataset.row));
  }
  function key(event: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const move = moves[event.key];
    if (!move) { if (event.key === "Escape") setSpot(null); return; }
    event.preventDefault();
    const start = spot ?? lastCell(grid);
    let column = Math.min(grid.weeks.length - 1, Math.max(0, start.column + move[0]));
    let row = Math.min(6, Math.max(0, start.row + move[1]));
    if (!grid.weeks[column]?.[row]) { column = start.column; row = start.row; }
    const target = scroller.current?.querySelector<HTMLElement>(`[data-column="${column}"][data-row="${row}"]`);
    target?.scrollIntoView({ block: "nearest", inline: "nearest" });
    place(column, row);
  }

  const best = grid.best;
  return <section className={styles.section} aria-labelledby="dash-activity">
    <div className={styles.sectionHead}>
      <h2 id="dash-activity"><Icon name="flame" />Өдөр тутмын идэвх</h2>
      <span className={styles.muted}>Сүүлийн нэг жилд {grid.total.toLocaleString("en-US")} үйлдэл · {grid.activeDays} идэвхтэй өдөр</span>
    </div>
    <div className={styles.card}>
      <div className={styles.heatWrap} ref={wrap}>
        <div className={styles.heatScroll} ref={scroller} tabIndex={0} role="group"
          aria-label={`Идэвхийн хүснэгт: ${grid.total} үйлдэл, ${grid.activeDays} идэвхтэй өдөр. Сумаар өдөр сонгоно.`}
          onMouseOver={hover} onMouseLeave={() => setSpot(null)} onKeyDown={key} onFocus={() => { if (!spot) place(lastCell(grid).column, lastCell(grid).row); }} onBlur={() => setSpot(null)}>
          <div className={styles.heat} style={{ gridTemplateColumns: `22px repeat(${grid.weeks.length}, minmax(var(--cell), 1fr))` }}>
            {grid.months.map(month => <span key={month.column} className={styles.heatMonth} style={{ gridColumn: `${month.column + 2} / span 4`, gridRow: 1 }} aria-hidden="true">{month.label}</span>)}
            {Object.entries(ROW_LABELS).map(([row, label]) => <span key={row} className={styles.heatDay} style={{ gridColumn: 1, gridRow: Number(row) + 2 }} aria-hidden="true">{label}</span>)}
            {grid.weeks.map((week, column) => week.map((day, row) => day ? <span key={day.day} data-column={column} data-row={row} data-level={day.level}
              data-active={spot && spot.column === column && spot.row === row ? "" : undefined}
              className={styles.heatCell} style={{ gridColumn: column + 2, gridRow: row + 2 }} /> : null))}
          </div>
        </div>
        {cell && spot ? <div className={styles.tooltip} style={{ left: spot.x, top: spot.y }} role="status">{cellLabel(cell)}</div> : null}
      </div>
      <div className={styles.heatFoot}>
        <ul className={styles.kinds} aria-label="Төрлөөр">{ACTIVITY_KINDS.map(kind => <li key={kind.id}><strong>{grid.byKind[kind.id].toLocaleString("en-US")}</strong>{kind.label}</li>)}</ul>
        <div className={styles.legend} aria-label="Өнгөний тайлбар">
          <span>Бага</span>
          {LEGEND.map((label, level) => <i key={label} data-level={level} title={label + " үйлдэл"} />)}
          <span>Их</span>
        </div>
      </div>
      {grid.total ? best ? <p className={styles.muted}>Хамгийн идэвхтэй өдөр: {mnDate(best.day)} · {best.total} үйлдэл</p> : null
        : <p className={styles.muted}>Mock өгөх, дадлага хийх, үг давтах, AI ашиглах, ажлаа чагтлах бүрт энд өдрийн нүд будагдана.</p>}
    </div>
  </section>;
}

function lastCell(grid: ActivityGrid) {
  const column = grid.weeks.length - 1;
  const row = grid.weeks[column].reduce((found, day, index) => (day ? index : found), 0);
  return { column, row };
}
