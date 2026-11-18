import type { TopikChart, TopikDoc, TopikGroup, TopikItem, TopikPicture } from "../types";
import { KoreanText, topikChars } from "./text";
import "./topik.css";

export const CIRCLED = ["①", "②", "③", "④"] as const;

/** A printed notice, ticket, e-mail or advertisement: `항목 | 내용` lines become a two-column table. */
export function TopikDocView({ doc }: { doc: TopikDoc }) {
  const rows: (string | [string, string])[] = doc.lines.map(line => {
    const at = line.indexOf(" | ");
    return at < 0 ? line : [line.slice(0, at), line.slice(at + 3)];
  });
  const blocks: (string | [string, string][])[] = [];
  for (const row of rows) {
    if (typeof row === "string") blocks.push(row);
    else if (Array.isArray(blocks.at(-1))) (blocks.at(-1) as [string, string][]).push(row);
    else blocks.push([row]);
  }
  return <figure className="topik-doc" data-kind={doc.kind} lang="ko">
    {doc.from || doc.to ? <p className="topik-doc-head">{doc.from ? <span>보낸 사람: {doc.from}</span> : null}{doc.to ? <span>받는 사람: {doc.to}</span> : null}</p> : null}
    {doc.title ? <p className="topik-doc-title"><KoreanText text={doc.title} inline/></p> : null}
    {blocks.map((block, i) => typeof block === "string"
      ? <p key={i}><KoreanText text={block} inline/></p>
      : <table key={i}><tbody>{block.map(([head, body], j) => <tr key={j}><th scope="row"><KoreanText text={head} inline/></th><td><KoreanText text={body} inline/></td></tr>)}</tbody></table>)}
    {doc.footer ? <p className="topik-doc-footer"><KoreanText text={doc.footer} inline/></p> : null}
  </figure>;
}

const nice = (value: number) => {
  if (value <= 0) return 1;
  const step = 10 ** Math.floor(Math.log10(value));
  return [1, 2, 2.5, 5, 10].map(f => f * step).find(v => v >= value) ?? value;
};
const number = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1);

/** The graph or table a TOPIK item prints, drawn from its numbers (title, unit and labels in Korean). */
export function TopikChartView({ chart, compact = false }: { chart: TopikChart; compact?: boolean }) {
  const legend = chart.series.length > 1 && chart.type !== "pie" && chart.type !== "table"
    ? <ul className="topik-legend">{chart.series.map((s, i) => <li key={s.name}><span className={"topik-key topik-s" + i} aria-hidden="true"/>{s.name}</li>)}</ul> : null;
  const summary = chart.series.map(s => `${s.name}: ${chart.labels.map((label, i) => `${label} ${number(s.values[i])}${chart.unit ?? ""}`).join(", ")}`).join("; ");
  return <figure className={"topik-chart" + (compact ? " compact" : "")} lang="ko">
    <figcaption><strong>{chart.title}</strong>{chart.unit && chart.type !== "table" ? <span>(단위: {chart.unit})</span> : null}</figcaption>
    {chart.type === "table" ? <table><thead><tr><th scope="col"/>{chart.series.map(s => <th scope="col" key={s.name}>{s.name}</th>)}</tr></thead>
      <tbody>{chart.labels.map((label, i) => <tr key={label}><th scope="row">{label}</th>{chart.series.map(s => <td key={s.name}>{number(s.values[i])}{chart.unit ?? ""}</td>)}</tr>)}</tbody></table>
      : <svg viewBox="0 0 480 290" role="img" aria-label={`${chart.title}. ${summary}`}>{plot(chart)}</svg>}
    {legend}
    {chart.note ? <p className="topik-chart-note">{chart.note}</p> : null}
  </figure>;
}

function plot(chart: TopikChart) {
  const series = chart.series, labels = chart.labels, unit = chart.unit === "%" ? "%" : "";
  if (chart.type === "pie") {
    const values = series[0]?.values ?? [], total = values.reduce((a, b) => a + b, 0) || 1;
    let angle = -Math.PI / 2;
    return values.map((value, i) => {
      const sweep = value / total * Math.PI * 2, start = angle, end = angle + sweep, mid = start + sweep / 2;
      angle = end;
      const r = 100, cx = 240, cy = 145, p = (a: number, rr = r) => `${cx + Math.cos(a) * rr} ${cy + Math.sin(a) * rr}`;
      const path = sweep >= Math.PI * 2 - 1e-6 ? `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0` : `M ${cx} ${cy} L ${p(start)} A ${r} ${r} 0 ${sweep > Math.PI ? 1 : 0} 1 ${p(end)} Z`;
      const [lx, ly] = p(mid, r + 26).split(" ").map(Number);
      return <g key={labels[i]}>
        <path d={path} className="topik-slice" style={{ fillOpacity: 1 - i * (0.8 / Math.max(1, values.length - 1)) }}/>
        <text x={lx} y={ly} textAnchor={lx < cx - 10 ? "end" : lx > cx + 10 ? "start" : "middle"} dominantBaseline="middle" className="topik-label">{labels[i]} {number(value)}{unit}</text>
      </g>;
    });
  }
  const max = nice(Math.max(...series.flatMap(s => s.values)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => f * max);
  if (chart.type === "hbar") {
    const left = 110, right = 440, top = 14, bottom = 268, row = (bottom - top) / labels.length, bar = row * 0.62 / series.length;
    const x = (v: number) => left + v / max * (right - left);
    return <>
      {ticks.map(t => <g key={t}><line x1={x(t)} x2={x(t)} y1={top} y2={bottom} className="topik-grid"/><text x={x(t)} y={bottom + 16} textAnchor="middle" className="topik-axis">{number(t)}</text></g>)}
      {labels.map((label, i) => <g key={label}>
        <text x={left - 8} y={top + row * i + row / 2} textAnchor="end" dominantBaseline="middle" className="topik-label">{label}</text>
        {series.map((s, j) => { const y = top + row * i + row * 0.19 + bar * j; return <g key={s.name}><rect x={left} y={y} width={Math.max(1, x(s.values[i]) - left)} height={bar - 2} className={"topik-s" + j}/><text x={x(s.values[i]) + 4} y={y + bar / 2} dominantBaseline="middle" className="topik-value">{number(s.values[i])}{unit}</text></g>; })}
      </g>)}
    </>;
  }
  const left = 44, right = 466, top = 16, bottom = 250, col = (right - left) / labels.length;
  const y = (v: number) => bottom - v / max * (bottom - top);
  const axes = <>
    {ticks.map(t => <g key={t}><line x1={left} x2={right} y1={y(t)} y2={y(t)} className="topik-grid"/><text x={left - 6} y={y(t)} textAnchor="end" dominantBaseline="middle" className="topik-axis">{number(t)}</text></g>)}
    {labels.map((label, i) => <text key={label} x={left + col * i + col / 2} y={bottom + 18} textAnchor="middle" className="topik-label">{label}</text>)}
  </>;
  if (chart.type === "line") return <>{axes}{series.map((s, j) => {
    const points = s.values.map((v, i) => [left + col * i + col / 2, y(v)] as const);
    return <g key={s.name} className={"topik-line topik-s" + j}>
      <polyline points={points.map(p => p.join(",")).join(" ")}/>
      {points.map(([px, py], i) => <g key={i}><circle cx={px} cy={py} r={4}/><text x={px} y={py - 10} textAnchor="middle" className="topik-value">{number(s.values[i])}{unit}</text></g>)}
    </g>;
  })}</>;
  const bar = col * 0.66 / series.length;
  return <>{axes}{labels.map((label, i) => series.map((s, j) => {
    const x = left + col * i + col * 0.17 + bar * j, top_ = y(s.values[i]);
    return <g key={label + s.name}><rect x={x + 1} y={top_} width={bar - 2} height={Math.max(1, bottom - top_)} className={"topik-s" + j}/><text x={x + bar / 2} y={top_ - 5} textAnchor="middle" className="topik-value">{number(s.values[i])}{unit}</text></g>;
  }))}</>;
}

/** The 보기 (worked example) of a block, with its answer marked as on the paper. */
export function TopikExample({ example }: { example: NonNullable<TopikGroup["example"]> }) {
  return <aside className="topik-example" aria-label="Жишээ (보기)">
    <p className="topik-example-tag" lang="ko">&lt;보 기&gt;</p>
    {example.lines ? <div className="topik-example-lines" lang="ko">{example.lines.map((line, i) => <p key={i}><KoreanText text={line} inline/></p>)}</div> : null}
    {example.passage ? <KoreanText text={example.passage}/> : null}
    <ol className="topik-example-choices" lang="ko">{example.choices.map((choice, i) => <li key={i} data-answer={i + 1 === example.answer ? "" : undefined}><span aria-hidden="true">{CIRCLED[i]}</span> <KoreanText text={choice} inline/>{i + 1 === example.answer ? <span className="sr-only"> (зөв хариу)</span> : null}</li>)}</ol>
  </aside>;
}

/** What a block prints above its questions: the instruction, its 보기 and the text a paired set shares. */
export function TopikGroupHead({ group, note, example = true }: { group: TopikGroup; note?: string; example?: boolean }) {
  return <>
    <p className="topik-instruction"><span className="topik-range">※ {group.range}</span> <span lang="ko">{group.instruction}</span>{group.plays ? <span className="topik-plays">{group.plays === 2 ? "Хоёр удаа" : "Нэг удаа"} уншина</span> : null}</p>
    {note ? <p className="topik-note">{note}</p> : null}
    {example && group.example ? <TopikExample example={group.example}/> : null}
    <TopikPrint item={group}/>
  </>;
}

/** A text, document or chart a question (or a paired set) prints. */
export function TopikPrint({ item }: { item: Pick<TopikItem, "passage" | "doc" | "chart"> }) {
  return <>
    {item.doc ? <TopikDocView doc={item.doc}/> : null}
    {item.chart ? <TopikChartView chart={item.chart}/> : null}
    {item.passage ? <div className="topik-passage"><KoreanText text={item.passage}/></div> : null}
  </>;
}

function Picture({ picture }: { picture: TopikPicture }) {
  // Static answer-free SVGs, shown as images so their styles stay inside them.
  // eslint-disable-next-line @next/next/no-img-element
  return picture.src ? <img src={picture.src} alt={picture.alt} width={480} height={360} loading="lazy" decoding="async"/> : <span className="topik-picture-missing">{picture.alt}</span>;
}

type QuestionLike = { id: string; number?: string; options?: string[]; topik?: TopikItem };

/**
 * One choice question: its question line (a paired set), its own text, the insertion sentence and four choices, pictures
 * or charts. `correct` marks the key after a practice check or in review; it is never sent before that.
 */
export function TopikQuestion({ question, value, disabled, correct, onChange, own = true }: { question: QuestionLike; value: string | undefined; disabled: boolean; correct?: string; onChange: (value: string) => void; own?: boolean }) {
  const item = question.topik ?? {};
  const options = question.options ?? [...CIRCLED];
  const variant = item.pictures ? "pictures" : item.charts ? "charts" : (item.choices ?? []).some(choice => topikChars(choice) > 22) ? "rows" : "grid";
  return <div className="topik-question">
    {item.line ? <p className="topik-line" lang="ko"><KoreanText text={item.line} inline/></p> : null}
    {own ? <TopikPrint item={item}/> : null}
    {item.sentence ? <p className="topik-sentence" lang="ko"><KoreanText text={item.sentence} inline/></p> : null}
    <fieldset className={"topik-options topik-options-" + variant} disabled={disabled}>
      <legend className="sr-only">{question.number} · хариулт сонгох</legend>
      {options.map((option, i) => <label key={option} data-selected={value === option ? "" : undefined} data-correct={correct === option ? "" : undefined}>
        <input type="radio" name={"topik-" + question.id} value={option} checked={value === option} onChange={() => onChange(option)}/>
        <span className="topik-mark" aria-hidden="true">{option}</span>
        {item.pictures?.[i] ? <span className="topik-picture"><Picture picture={item.pictures[i]}/></span>
          : item.charts?.[i] ? <TopikChartView chart={item.charts[i]} compact/>
          : <span className="topik-choice"><span className="sr-only">{option} </span><KoreanText text={item.choices?.[i] ?? option} inline/></span>}
      </label>)}
    </fieldset>
  </div>;
}

/** 51–52 answers are kept as one value, a line per gap: "㉠ …\n㉡ …". */
export function gapValues(value: string | undefined, gaps: string[]) {
  const lines = (value ?? "").split("\n");
  return Object.fromEntries(gaps.map(gap => [gap, lines.find(line => line.startsWith(gap + " "))?.slice(gap.length + 1) ?? ""]));
}

/** A writing task (51–54): the text with its gaps or the essay task, and the answer boxes with a live character count. */
export function TopikWriting({ question, value, disabled, onChange }: { question: QuestionLike; value: string | undefined; disabled: boolean; onChange: (value: string) => void }) {
  const item = question.topik ?? {};
  const gaps = item.gaps;
  if (gaps) {
    const current = gapValues(value, gaps);
    const set = (gap: string, text: string) => onChange(gaps.map(g => `${g} ${(g === gap ? text : current[g]).replace(/\n/g, " ")}`).join("\n"));
    return <div className="topik-writing">
      <TopikPrint item={item}/>
      {gaps.map(gap => <label className="topik-gap-answer" key={gap}><span lang="ko">{gap}</span>
        <input type="text" lang="ko" maxLength={200} value={current[gap]} disabled={disabled} onChange={event => set(gap, event.target.value)} aria-label={`${question.number}. ${gap}-д орох өгүүлбэр`}/></label>)}
    </div>;
  }
  const count = topikChars(value ?? "");
  const [min, max] = item.chars ?? [0, 0];
  return <div className="topik-writing">
    {item.topic ? <p className="topik-writing-topic" lang="ko">주제: ‘{item.topic}’</p> : null}
    {item.charts?.length ? <div className="topik-chart-row">{item.charts.map((chart, i) => <TopikChartView key={i} chart={chart}/>)}</div> : null}
    {item.notes?.length ? <ul className="topik-notes" lang="ko">{item.notes.map(note => <li key={note}><KoreanText text={note} inline/></li>)}</ul> : null}
    {item.prompt ? <div className="topik-passage topik-essay-task"><KoreanText text={item.prompt}/>{item.bullets?.length ? <ul lang="ko">{item.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}</ul> : null}</div> : null}
    <textarea lang="ko" className="topik-essay" rows={item.chars && item.chars[1] > 400 ? 18 : 9} maxLength={4000} value={value ?? ""} disabled={disabled} onChange={event => onChange(event.target.value)} aria-label={`${question.number}. Хариугаа бичих`} spellCheck={false}/>
    <p className="topik-count" data-state={count === 0 ? "empty" : count < min ? "short" : count > max ? "long" : "ok"}>{count} тэмдэгт (зай орно) · зорилт {min}–{max}{count > 0 && count < min ? ` · ${min - count} дутуу` : count > max ? ` · ${count - max} илүү` : ""}</p>
  </div>;
}
