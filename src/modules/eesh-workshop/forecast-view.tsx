import Link from "next/link";
import { ENTRANCE_SUBJECT_ORDER, entranceSubjectLabels } from "../exams/entrance/subjects";
import { drillHref, type EeshInsights } from "./contracts";
import type { EeshForecast, ForecastPosition, ForecastTopic } from "./forecast";
import styles from "./eesh.module.css";

const percent = (p: number) => Math.min(99, Math.max(1, Math.round(p * 100))) + "%";
const words = (subject: EeshInsights["subject"]) => subject === "english" ? { part1: "асуулт", part2: "асуулт" } : { part1: "сонгох", part2: subject === "math" || subject === "physics" ? "бодлого" : "бүтээх даалгавар" };
const TIERS = [
  { min: 0.85, title: "Бараг заавал гарна", hint: "85%-иас дээш" },
  { min: 0.6, title: "Гарах магадлал өндөр", hint: "60–85%" },
  { min: 0.3, title: "Гарч магадгүй", hint: "30–60%" },
  { min: 0, title: "Магадлал бага", hint: "30%-иас доош" },
];
const TREND: Record<NonNullable<ForecastTopic["trend"]>, string> = { up: "↑ оноо нэмэгдэж магадгүй", down: "↓ оноо буурч магадгүй", back: "↺ эргэн ирж магадгүй", steady: "Тогтвортой" };

/** The 2027 forecast page (/labs/eesh/<subject>/forecast, owner request 2026-11-20): the predicted paper's format and
 * make-up, each topic's chance with its likely exercise types, the paper position by position, area points, and how well the
 * same method predicted the last three known years. Built from this site's mocks; not an official prediction. */
export function EeshForecastView({ forecast, insights }: { forecast: EeshForecast; insights: EeshInsights }) {
  const { subject, label, target, to, format } = forecast, test = forecast.backtest;
  const names = new Map(insights.topics.map(topic => [topic.id, topic])), w = words(subject);
  const topicName = (id: string) => names.get(id)?.label ?? id;
  const likely = forecast.topics.filter(topic => (topic.p ?? 0) >= 0.6).length;
  const top = forecast.domains[0], spread = test?.domainError ?? 0;
  const scale = Math.max(...forecast.domains.map(domain => Math.max(domain.high, domain.last)), 1);
  const part = (n: 1 | 2) => forecast.positions.filter(position => position.part === n);
  const stableText = forecast.stable >= forecast.years ? `${forecast.from}–${to}: бүх ${forecast.years} жилд ижил` : forecast.stable === 1 ? `${to} онд шинэчлэгдсэн` : `Сүүлийн ${forecast.stable} жил өөрчлөгдөөгүй`;
  const drill = (id: string, name: string) => (names.get(id)?.drill ?? 0) > 0
    ? <Link className={styles.drillLink} href={drillHref(subject, "topic:" + id)} prefetch={false} aria-label={name + ": дасгал хийх"}>Дасгал</Link> : null;
  const skills = (list: { label: string }[]) => list.length ? <ul className={styles.fcSkills} aria-label="Гарч болох даалгаврын төрөл">{list.map(skill => <li key={skill.label}>{skill.label}</li>)}</ul> : null;

  const topicRow = (topic: ForecastTopic) => <li key={topic.id} className={styles.fcTopic}>
    <div className={styles.topicMain}>
      <strong>{topic.label}</strong>
      <div className={styles.topicMeta}>
        <span>{topic.domain}</span>
        <span>≈ {topic.questions} асуулт · {topic.points} оноо</span>
        <span>{to}: {topic.lastQuestions} асуулт</span>
        {topic.trend && topic.trend !== "steady" ? <span className={styles.fcTrend} data-trend={topic.trend}>{TREND[topic.trend]}</span> : null}
      </div>
      {skills(topic.skills)}
    </div>
    <div className={styles.fcSide}>
      {topic.p === null ? null : <div className={styles.fcChance}><b>{percent(topic.p)}</b><div className={styles.bar} role="img" aria-label={`Гарах магадлал ${percent(topic.p)}`}><span style={{ width: Math.round(topic.p * 100) + "%" }} /></div></div>}
      {drill(topic.id, topic.label)}
    </div>
  </li>;

  const positionRow = (position: ForecastPosition) => {
    const [head, ...rest] = position.picks, area = position.areas[0];
    const sameAsLast = head ? head.topic === position.last : area?.name === position.lastArea;
    return <li key={position.pos} className={styles.fcPosition}>
      <span className={styles.fcNumber}>{position.pos}<small>{position.points} оноо</small></span>
      <div className={styles.topicMain}>
        <strong>{head ? topicName(head.topic) : area ? area.name : "Сэдэв тодорхойгүй"}{head?.p != null ? <span className={styles.fcP}> {percent(head.p)}</span> : area ? <span className={styles.fcP}> {percent(area.p)}</span> : null}</strong>
        <div className={styles.topicMeta}>
          {head ? <span>{position.domain}</span> : null}
          {rest.length ? <span>Эсвэл: {rest.map(pick => `${topicName(pick.topic)}${pick.p != null ? " " + percent(pick.p) : ""}`).join(", ")}</span> : null}
          {position.areas.length > 1 ? <span>Эсвэл: {position.areas.slice(1).map(item => `${item.name} ${percent(item.p)}`).join(", ")}</span> : null}
          <span>{to}: {sameAsLast ? "ижил" : position.last ? topicName(position.last) : position.lastArea ?? "—"}</span>
        </div>
        {skills(position.skills)}
      </div>
    </li>;
  };

  return <div className={`wsp-page ${styles.page}`}>
    <Link className={styles.back} href={"/labs/eesh/" + subject} prefetch={false}>← {label} · ЭЕШ</Link>
    <header className={styles.head}>
      <p className={styles.eyebrow}>ЭЕШ · {label} · {target} оны таамаг</p>
      <h1>{target} оны ЭЕШ: {label} хичээлд юу гарч болох вэ?</h1>
      <p>{forecast.from}–{to} оны {forecast.years} жилийн {forecast.papers} mock-оос тооцсон таамаг. Албан ёсны мэдээлэл биш, алдаатай байж болно: давтах сэдвээ сонгох, бэлтгэлээ төлөвлөхөд ашиглаарай.</p>
    </header>
    <nav className={styles.subjects} aria-label="Хичээл">
      {ENTRANCE_SUBJECT_ORDER.map(item => <Link key={item} href={`/labs/eesh/${item}/forecast`} aria-current={item === subject ? "page" : undefined} prefetch={false}>{entranceSubjectLabels[item]}</Link>)}
    </nav>

    <dl className={styles.facts}>
      <div className={styles.fact}><dt>{target} оны бүтэц</dt><dd>{format.part1.count} {w.part1} · {format.part2.count} {w.part2}</dd><small>{format.minutes} минут · {format.points} оноо · {stableText}</small></div>
      <div className={styles.fact}><dt>Таамгийн оновч</dt><dd>{test?.makeup != null ? `≈ ${Math.round(test.makeup * 100)}%` : "—"}</dd><small>Сүүлийн 3 жилд асуултын сэдэв таарсан хувь</small></div>
      <div className={styles.fact}><dt>Гарах магадлал өндөр</dt><dd>{likely} сэдэв</dd><small>60%-иас дээш магадлалтай</small></div>
      <div className={styles.fact}><dt>Хамгийн их оноотой</dt><dd>{top ? top.name : "—"}</dd><small>{top ? `≈ ${top.points} оноо${spread ? ` (${top.low}–${top.high})` : ""} · ${to}: ${top.last}` : ""}</small></div>
    </dl>

    <section className={styles.section} aria-labelledby="fc-makeup">
      <div className={styles.sectionHead}><h2 id="fc-makeup">Таамагласан бүтэц</h2>
        <p>{target} оны нэг хувилбарт сэдэв бүрээс хэдэн асуулт ирж болох вэ (сүүлийн онууд илүү жинтэй). Хажууд нь {to} онд хэд байсан.</p></div>
      <div className={styles.fcMakeup}>{forecast.makeup.map(block => <div key={block.part} className={styles.fcPart}>
        <h3>{block.part === 1 ? "I хэсэг" : "II хэсэг"} · {block.part === 1 ? format.part1.count : format.part2.count} {block.part === 1 ? w.part1 : w.part2}{block.by === "area" ? " · чиглэлээр" : ""}</h3>
        <ul className={styles.fcItems}>{block.items.map(item => <li key={item.key}>
          <b>{item.questions}</b><span>{block.by === "topic" ? topicName(item.key) : item.key}</span>
          <small data-diff={item.questions > item.last ? "up" : item.questions < item.last ? "down" : undefined}>{to}: {item.last}</small>
        </li>)}</ul>
      </div>)}</div>
      {subject === "english" ? <p className={styles.note}>II хэсгийг даалгавраар (3 даалгавар) тоолсон.</p> : null}
    </section>

    <section className={styles.section} aria-labelledby="fc-topics">
      <div className={styles.sectionHead}><h2 id="fc-topics">Гарч болох сэдэв ба даалгавар</h2>
        <p>Сэдэв бүрийн гарах магадлал, хүлээгдэх асуулт ба оноо, ихэвчлэн ирдэг даалгаврын төрөл. Магадлал нь сүүлийн онуудад хэр олон удаа гарсанд суурилсан.</p></div>
      {TIERS.map((tier, i) => {
          const list = forecast.topics.filter(topic => (topic.p ?? 0) >= tier.min && (i === 0 || (topic.p ?? 0) < TIERS[i - 1].min));
          if (!list.length) return null;
          const body = <ol className={styles.topics}>{list.map(topicRow)}</ol>;
          return tier.min === 0
            ? <details key={tier.title} className={styles.more}><summary>{tier.title} ({tier.hint}) · {list.length} сэдэв</summary>{body}</details>
            : <div key={tier.title} className={styles.fcTier}><h3>{tier.title} <span>{tier.hint} · {list.length} сэдэв</span></h3>{body}</div>;
        })}
    </section>

    <section className={styles.section} aria-labelledby="fc-positions">
      <div className={styles.sectionHead}><h2 id="fc-positions">Даалгавар бүрээр</h2>
        <p>Асуулт бүрийн хамгийн магадлалтай сэдэв. Сэдэв жил бүр нэг хоёр дугаараар шилждэг тул энэ хэсэг дээрх бүтцээс бага найдвартай{test?.top1 != null ? ` (сүүлийн 3 жилд дугаар бүрийн эхний таамаг ≈ ${Math.round(test.top1 * 100)}% таарсан)` : ""}.</p></div>
      <div className={styles.fcPart}>
        <h3>II хэсэг · {format.part2.count} {w.part2} · {format.part2.points} оноо</h3>
        <ol className={styles.fcPositions}>{part(2).map(positionRow)}</ol>
      </div>
      <details className={styles.more} open>
        <summary>I хэсэг · {format.part1.count} {w.part1} · {format.part1.points} оноо</summary>
        <ol className={styles.fcPositions}>{part(1).map(positionRow)}</ol>
      </details>
    </section>

    <section className={styles.section} aria-labelledby="fc-domains">
      <div className={styles.sectionHead}><h2 id="fc-domains">Чиглэлийн оноо</h2>
        <p>{target} онд чиглэл бүрээс хэдэн оноо ирж болох вэ ({format.points} онооноос). Цайвар хэсэг: сүүлийн 3 жилийн таамгийн дундаж алдаа (±{spread} оноо).</p></div>
      <p className={styles.fcLegend} aria-hidden="true"><span className={styles.fcKeyBar} /> {target} оны таамаг <span className={styles.fcKeyTick} /> {to} он</p>
      <ul className={styles.fcDomains}>{forecast.domains.map(domain => <li key={domain.name} title={`${domain.name}: ${target} ≈ ${domain.points} оноо${spread ? ` (${domain.low}–${domain.high})` : ""}, ${to}: ${domain.last}`}>
        <span className={styles.fcDomainName}>{domain.name}</span>
        <span className={styles.fcTrack} role="img" aria-label={`${target}: ${domain.points} оноо, ${to}: ${domain.last} оноо`}>
          {spread ? <i className={styles.fcRange} style={{ left: (domain.low / scale) * 100 + "%", width: ((domain.high - domain.low) / scale) * 100 + "%" }} /> : null}
          <i className={styles.fcValue} style={{ width: (domain.points / scale) * 100 + "%" }} />
          <i className={styles.fcTick} style={{ left: `calc(${(domain.last / scale) * 100}% - 1px)` }} />
        </span>
        <span className={styles.fcDomainValue}><b>{domain.points}</b> · {to}: {domain.last}</span>
      </li>)}</ul>
    </section>

    <section className={styles.section} aria-labelledby="fc-test">
      <div className={styles.sectionHead}><h2 id="fc-test">Хэр найдвартай вэ?</h2>
        <p>Ижил аргаар сүүлийн 3 жил бүрийг зөвхөн түүнээс өмнөх mock-оор таамаглаж, тухайн жилийн хувилбартай харьцуулсан.</p></div>
      {test ? <div className={styles.scroll}><table className={styles.table}>
        <thead><tr><th scope="col">Таамагласан он</th><th scope="col">Асуултын сэдэв таарсан</th><th scope="col">Гарсан сэдвээс урьдчилан хэлсэн</th><th scope="col">Дугаар бүрийн сэдэв</th><th scope="col">Чиглэлийн оноо</th></tr></thead>
        <tbody>{test.years.map(year => <tr key={year.year}>
          <th scope="row" className={styles.year}>{year.year}{year.sameFormat ? null : <small>бүтэц өөрчлөгдсөн</small>}</th>
          <td>{year.makeup != null ? Math.round(year.makeup * 100) + "%" : "—"}</td>
          <td>{year.caught}/{year.appeared}</td>
          <td>{year.top1 != null ? Math.round(year.top1 * 100) + "%" : "—"}</td>
          <td>±{year.domainError} оноо</td>
        </tr>)}</tbody>
      </table></div> : null}
      <ul className={styles.fcNotes}>
        <li>Тоо баримт энэ сайтын ЭЕШ mock-оос. Тэдгээр нь тухайн оны албан ёсны хувилбарын бүтэц, сэдвийн дарааллаар зохиогдсон боловч албан ёсны статистик биш.</li>
        <li>Сүүлийн онууд илүү жинтэй. Асуултын тоо өөрчлөгдсөн онуудыг сэдвийн дарааллаар нь {to} оны хувилбартай тааруулсан.</li>
        {forecast.skipped.length ? <li>{forecast.skipped.join(", ")} оны хувилбар олдоогүй: тэр оны mock өөр оны дарааллыг дагадаг тул таамагт оруулаагүй.</li> : null}
        {subject === "biology" ? <li>Биологийн II хэсгийн даалгаврыг сэдвээр ангилаагүй тул чиглэлээр нь харуулсан.</li> : null}
        {subject === "english" ? null : <li>Даалгаврын төрлийн нэрийг mock-ийн тэмдэглэгээнээс автоматаар монголчилсон; багш хянаагүй.</li>}
        <li>Шинэ бүтэц, шинэ сэдэв гарвал таамаг үүнийг урьдчилан мэдэхгүй.</li>
      </ul>
    </section>
  </div>;
}
