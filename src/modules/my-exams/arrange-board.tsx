"use client";
// Matching and sequence questions answered by arranging (2026-11-17): connect the cards, or put the steps in order.
// The answer is still one number (`arrange.ts`), so saving, grading and the review are the same as for an option.
import { useCallback, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { MathText } from "@/modules/exams/math-text";
import { ITEM_LETTERS, answerArrangement, arrangementAnswer, type Arrangement, type Board } from "./arrange";
import type { ExamQuestion } from "./contracts";
import styles from "./my-exams.module.css";

type MatchBoardData = Extract<Board, { kind: "match" }>;
type OrderBoardData = Extract<Board, { kind: "order" }>;
type Props<B> = { question: ExamQuestion; board: B; value: number | undefined; onAnswer: (value: number | null) => void };

/** The pair colours: the same pair keeps its colour on both cards and on its line. */
const PAIR = (index: number) => `var(--mx-pair-${index % 5})`;

export function MatchBoard({ question, board, value, onAnswer }: Props<MatchBoardData>) {
  const size = board.left.length;
  // links[i] is the lettered item joined to numbered item i, or -1.
  const [links, setLinks] = useState<number[]>(() => answerArrangement(question, board, value) ?? Array(size).fill(-1));
  const [active, setActive] = useState<{ side: "left" | "right"; index: number } | null>(null);
  const [paths, setPaths] = useState<{ d: string; pair: number }[]>([]);
  const box = useRef<HTMLDivElement>(null);
  const leftCards = useRef<(HTMLButtonElement | null)[]>([]);
  const rightCards = useRef<(HTMLButtonElement | null)[]>([]);

  const measure = useCallback(() => {
    const frame = box.current?.getBoundingClientRect();
    if (!frame) return;
    const next: { d: string; pair: number }[] = [];
    links.forEach((letter, item) => {
      const from = leftCards.current[item]?.getBoundingClientRect(), to = letter >= 0 ? rightCards.current[letter]?.getBoundingClientRect() : undefined;
      if (!from || !to) return;
      const x1 = from.right - frame.left, y1 = from.top + from.height / 2 - frame.top;
      const x2 = to.left - frame.left, y2 = to.top + to.height / 2 - frame.top;
      const bend = Math.max(12, (x2 - x1) / 2);
      next.push({ d: `M${x1} ${y1} C${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`, pair: item });
    });
    setPaths(next);
  }, [links]);
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(() => measure());
    if (box.current) observer.observe(box.current);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [measure]);

  function commit(next: number[]) {
    setLinks(next);
    onAnswer(next.every(letter => letter >= 0) ? arrangementAnswer(question, board, next) : null);
  }
  function join(item: number, letter: number) {
    // A card belongs to one pair: joining it again moves it.
    const next = links.map(other => other === letter ? -1 : other);
    next[item] = letter;
    setActive(null);
    commit(next);
  }
  function pick(side: "left" | "right", index: number) {
    if (active && active.side !== side) join(side === "left" ? index : active.index, side === "left" ? active.index : index);
    else setActive(active && active.side === side && active.index === index ? null : { side, index });
  }
  const pairOfRight = (letter: number) => links.indexOf(letter);
  const joined = links.filter(letter => letter >= 0).length;

  return <div className={styles.board}>
    <div className={styles.matchBox} ref={box}>
      <svg className={styles.matchLines} aria-hidden="true">
        {paths.map(path => <path key={path.pair} d={path.d} style={{ stroke: PAIR(path.pair) }} />)}
      </svg>
      <ul className={styles.matchColumn} aria-label="Тоотой зүйлс">
        {board.left.map((text, item) => {
          const on = active?.side === "left" && active.index === item, linked = links[item] >= 0;
          return <li key={item}><button type="button" ref={element => { leftCards.current[item] = element; }}
            className={styles.matchCard} data-side="left" data-on={on ? "" : undefined} data-linked={linked ? "" : undefined}
            style={linked ? { ["--mx-pair" as string]: PAIR(item) } : undefined} aria-pressed={on}
            aria-label={`${item + 1}. ${text}${linked ? ` — ${ITEM_LETTERS[links[item]]}-тэй холбосон` : ""}`} onClick={() => pick("left", item)}>
            <span className={styles.matchTag}>{item + 1}</span><span className={styles.matchText}><MathText text={text} /></span>
          </button></li>;
        })}
      </ul>
      <ul className={styles.matchColumn} aria-label="Үсэгтэй зүйлс">
        {board.right.map((text, letter) => {
          const owner = pairOfRight(letter), on = active?.side === "right" && active.index === letter;
          return <li key={letter}><button type="button" ref={element => { rightCards.current[letter] = element; }}
            className={styles.matchCard} data-side="right" data-on={on ? "" : undefined} data-linked={owner >= 0 ? "" : undefined}
            style={owner >= 0 ? { ["--mx-pair" as string]: PAIR(owner) } : undefined} aria-pressed={on}
            aria-label={`${ITEM_LETTERS[letter]}) ${text}${owner >= 0 ? ` — ${owner + 1}-тэй холбосон` : ""}`} onClick={() => pick("right", letter)}>
            <span className={styles.matchTag}>{ITEM_LETTERS[letter]}</span><span className={styles.matchText}><MathText text={text} /></span>
          </button></li>;
        })}
      </ul>
    </div>
    <div className={styles.boardFoot}>
      <span role="status">{joined === size ? <><b>✓</b> Бүгдийг холбосон — хариулт хадгалагдлаа</> : active ? "Одоо нөгөө талаас тохирохыг нь сонгоно уу" : `${joined} / ${size} холбосон`}</span>
      {joined ? <button type="button" className={styles.boardReset} onClick={() => { setActive(null); commit(Array(size).fill(-1)); }}>Цэвэрлэх</button> : null}
    </div>
  </div>;
}

const moved = (order: readonly number[], from: number, to: number) => {
  const next = [...order];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

export function OrderBoard({ question, board, value, onAnswer }: Props<OrderBoardData>) {
  const size = board.steps.length;
  const listed = board.steps.map((_, index) => index);
  // order[k] is the listed step at position k; it starts as listed, which is never the right order.
  const [order, setOrder] = useState<Arrangement>(() => answerArrangement(question, board, value) ?? listed);
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null);
  const rows = useRef<(HTMLLIElement | null)[]>([]);
  // The cards' middles when the drag started: the preview moves the cards, so they are not measured again meanwhile.
  const middles = useRef<number[]>([]);
  const answered = value !== undefined;

  function place(next: Arrangement) { setOrder(next); onAnswer(arrangementAnswer(question, board, next)); }
  function start(event: ReactPointerEvent<HTMLElement>, from: number) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    middles.current = rows.current.slice(0, size).map(row => { const rect = row?.getBoundingClientRect(); return rect ? rect.top + rect.height / 2 : 0; });
    setDrag({ from, to: from });
  }
  function follow(event: ReactPointerEvent<HTMLElement>) {
    if (!drag) return;
    // The new place is the number of other cards whose middle is above the pointer.
    const to = middles.current.filter((middle, index) => index !== drag.from && event.clientY > middle).length;
    if (to !== drag.to) setDrag({ ...drag, to });
  }
  function drop() {
    if (drag && drag.from !== drag.to) place(moved(order, drag.from, drag.to));
    setDrag(null);
  }
  // While a card is dragged the list shows where it would land.
  const shown = drag ? moved(order, drag.from, drag.to) : order;
  const dragged = drag ? order[drag.from] : -1;

  return <div className={styles.board}>
    <ol className={styles.orderList} aria-label="Дараалал">
      {shown.map((step, position) => <li key={step} ref={element => { if (!drag && element) rows.current[position] = element; }}
        className={styles.orderRow} data-dragging={step === dragged ? "" : undefined}>
        <span className={styles.orderHandle} onPointerDown={event => start(event, position)} onPointerMove={follow} onPointerUp={drop} onPointerCancel={() => setDrag(null)}
          title="Чирж байрлуулах" aria-hidden="true">⠿</span>
        <span className={styles.orderPlace} aria-hidden="true">{position + 1}</span>
        <span className={styles.orderText}><MathText text={board.steps[step]} /></span>
        <span className={styles.orderMoves}>
          <button type="button" onClick={() => place(moved(order, position, position - 1))} disabled={position === 0 || Boolean(drag)} aria-label={`${board.steps[step]} — дээш`}>↑</button>
          <button type="button" onClick={() => place(moved(order, position, position + 1))} disabled={position === size - 1 || Boolean(drag)} aria-label={`${board.steps[step]} — доош`}>↓</button>
        </span>
      </li>)}
    </ol>
    <div className={styles.boardFoot}>
      <span role="status">{answered ? <><b>✓</b> Хариулт хадгалагдлаа — дахин зөөж өөрчилж болно</> : "Эхнийхээс сүүлийнх рүү эрэмбэлэхэд хариулт хадгалагдана"}</span>
      {answered ? <button type="button" className={styles.boardReset} onClick={() => { setOrder(listed); onAnswer(null); }}>Эхлэлд буцаах</button>
        : <button type="button" className={styles.boardReset} onClick={() => place(order)}>Энэ дарааллаар хариулах</button>}
    </div>
  </div>;
}

/** The review of an arranged question: the right pairs or order in words, and where the student's differed. */
export function BoardReview({ question, board, answer, chosen }: { question: ExamQuestion; board: Board; answer: number; chosen: number | null }) {
  const right = answerArrangement(question, board, answer);
  const mine = answerArrangement(question, board, chosen);
  if (!right) return null;
  if (board.kind === "match") return <ul className={styles.reviewPairs}>
    {board.left.map((text, item) => {
      const ok = mine ? mine[item] === right[item] : null;
      return <li key={item} data-ok={ok === null ? undefined : ok ? "yes" : "no"}>
        <span className={styles.matchTag}>{item + 1}</span>
        <span><MathText text={text} /></span>
        <span className={styles.reviewArrow} aria-hidden="true">→</span>
        <span><MathText text={board.right[right[item]]} />
          {mine && !ok ? <small className={styles.reviewYours}>Таны холбосон: <MathText text={board.right[mine[item]]} /></small> : null}</span>
      </li>;
    })}
  </ul>;
  return <div className={styles.reviewOrders}>
    <div><h4>Зөв дараалал</h4><ol>{right.map(step => <li key={step}><MathText text={board.steps[step]} /></li>)}</ol></div>
    {mine ? <div><h4>Таны дараалал</h4><ol>{mine.map((step, position) => <li key={step} data-ok={step === right[position] ? "yes" : "no"}><MathText text={board.steps[step]} /></li>)}</ol></div> : null}
  </div>;
}
