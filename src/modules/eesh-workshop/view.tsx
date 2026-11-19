import Link from "next/link";
import { ENTRANCE_SUBJECT_ORDER, entranceSubjectLabels } from "../exams/entrance/subjects";
import { domainTrends, drillChoices, drillHref, formatRuns, weakest, yearSpan, type EeshInsights, type EeshProgress } from "./contracts";
import { EeshDrill } from "./drill";
import styles from "./eesh.module.css";

const signed = (value: number) => (value > 0 ? "+" : value < 0 ? "−" : "±") + Math.abs(value);
const pct = (correct: number, checked: number) => Math.round((correct / checked) * 100);
const plural = (subject: EeshInsights["subject"]) => subject === "english" ? { part1: "асуулт", part2: "асуулт" } : { part1: "сонгох", part2: subject === "math" || subject === "physics" ? "бодлого" : "бүтээх даалгавар" };

/** One ЭЕШ subject: how the paper changed by year, which topics recur, the student's weak topics, and the way into the
 * drill page (each «Дасгал» opens it on that topic). */
export function EeshSubjectView({ insights, progress, signedIn, open }: { insights: EeshInsights; progress: EeshProgress | null; signedIn: boolean; open: number }) {
  const { subject, label, years } = insights;
  const runs = formatRuns(insights), trends = domainTrends(insights), span = yearSpan(years);
  const latest = insights.formats.at(-1)!, words = plural(subject);
  const riser = trends.filter(trend => trend.delta > 0).sort((a, b) => b.delta - a.delta)[0];
  const faller = trends.filter(trend => trend.delta < 0).sort((a, b) => a.delta - b.delta)[0];
  const everyYear = insights.topics.filter(topic => topic.years.length === years.length).length;
  const max = Math.max(...insights.domains.flatMap(domain => Object.values(domain.points)));
  const shade = (value: number) => value ? { background: `color-mix(in srgb, var(--wsp-accent) ${Math.round(6 + 36 * value / max)}%, transparent)` } : undefined;
  const weakTopics = progress ? weakest(progress.topics) : [], weakDomains = progress ? weakest(progress.domains) : [];
  const topicRow = (topic: EeshInsights["topics"][number], index: number) => <li key={topic.id} className={styles.topic}>
    <span className={styles.rank}>{index + 1}</span>
    <div className={styles.topicMain}>
      <strong>{topic.label}</strong>
      <div className={styles.topicMeta}>
        <span>{topic.domain}</span>
        <span className={styles.dots} aria-hidden="true">{years.map(year => <i key={year} className={styles.dot} data-on={topic.years.includes(year) ? "" : undefined} title={String(year)} />)}</span>
        <span>{topic.years.length}/{years.length} жил · {topic.questions} асуулт</span>
      </div>
    </div>
    <div className={styles.topicSide}>
      <span><b>≈ {topic.recent} оноо</b>сүүлийн 3 жилд</span>
      {topic.drill ? <Link className={styles.drillLink} href={drillHref(subject, "topic:" + topic.id)} prefetch={false} aria-label={topic.label + ": дасгал хийх"}>Дасгал</Link>
        : <span title="Текст, харилцан яриа эсвэл үгийн сантай даалгавар: бүтэн mock-ийн дадлагад ажиллана.">Бүтэн mock-д</span>}
    </div>
  </li>;

  // wsp-page: centred with the Workspace's page padding, like the other Workshop pages.
  return <div className={`wsp-page ${styles.page}`}>
    <Link className={styles.back} href="/workspace/workshop?exam=eesh" prefetch={false}>← Workshop · ЭЕШ</Link>
    <header className={styles.head}>
      <p className={styles.eyebrow}>ЭЕШ · {label} · {years[0]}–{years.at(-1)}</p>
      <h1>{label}: жилээс жилд юу өөрчлөгдсөн бэ?</h1>
      <p>{years.length} жилийн {insights.papers} mock-ийн бүтэц, сэдвийн оноо, хамгийн их давтагддаг даалгавар. Доор нь бүх жилийн асуултаас сэдвээр 10 асуултын дасгал.</p>
    </header>
    <nav className={styles.subjects} aria-label="Хичээл">
      {ENTRANCE_SUBJECT_ORDER.map(item => <Link key={item} href={"/labs/eesh/" + item} aria-current={item === subject ? "page" : undefined} prefetch={false}>{entranceSubjectLabels[item]}</Link>)}
    </nav>

    <dl className={styles.facts}>
      <div className={styles.fact}><dt>{years.at(-1)} оны бүтэц</dt><dd>{latest.part1.count} {words.part1} · {latest.part2.count} {words.part2}</dd><small>{latest.minutes} минут · {latest.points} оноо</small></div>
      <div className={styles.fact}><dt>Хамгийн их өссөн</dt><dd>{riser ? `${riser.name} ${signed(riser.delta)}` : "—"}</dd><small>{riser ? `${span.early} → ${span.late}, нэг mock-д` : "Сэдвийн хуваарь тогтмол"}</small></div>
      <div className={styles.fact}><dt>Хамгийн их буурсан</dt><dd>{faller ? `${faller.name} ${signed(faller.delta)}` : "—"}</dd><small>{faller ? `${span.early} → ${span.late}, нэг mock-д` : "Сэдвийн хуваарь тогтмол"}</small></div>
      <div className={styles.fact}><dt>Жил бүр гардаг</dt><dd>{everyYear} сэдэв</dd><small>{years.length} жилийн бүгдэд нь</small></div>
    </dl>
    <div className={styles.forecastLink}>
      <div><strong>{years.at(-1)! + 1} оны таамаг</strong><p>Аль сэдэв гарах магадлалтай, сэдэв бүрээс хэдэн асуулт, ямар төрлийн даалгавар ирж болох вэ. {years.length} жилийн mock-оос тооцсон, алдаатай байж болно.</p></div>
      <Link className="button" href={`/labs/eesh/${subject}/forecast`} prefetch={false}>Таамаг үзэх →</Link>
    </div>

    <section className={styles.section} aria-labelledby="eesh-format">
      <div className={styles.sectionHead}><h2 id="eesh-format">Бүтэц жилээр</h2><p>Асуултын тоо, оноо, хугацаа. Ижил бүтэцтэй жилүүдийг нэг мөрөнд нэгтгэсэн.</p></div>
      <div className={styles.scroll}><table className={styles.table}>
        <thead><tr><th scope="col">Он</th><th scope="col">I хэсэг</th><th scope="col">II хэсэг</th><th scope="col">Хугацаа</th><th scope="col">Өөрчлөлт</th></tr></thead>
        <tbody>{runs.map(run => <tr key={run.from}>
          <th scope="row" className={styles.year}>{run.from === run.to ? run.from : `${run.from}–${run.to}`}{run.missing.length ? <small>{run.missing.join(", ")} оны mock байхгүй</small> : null}</th>
          <td>{run.format.part1.count} {words.part1} · {run.format.part1.points} оноо{run.format.listening ? ` · сонсгол ${run.format.listening} оноо` : ""}</td>
          <td>{run.format.part2.count} {words.part2} · {run.format.part2.points} оноо</td>
          <td>{run.format.minutes} мин</td>
          <td>{run.notes.length ? <span className={styles.chips}>{run.notes.map(note => <span key={note} className={styles.chip}>{note}</span>)}</span> : <span className={styles.none}>{run === runs[0] ? "Эхлэл" : "—"}</span>}</td>
        </tr>)}</tbody>
      </table></div>
    </section>

    <section className={styles.section} aria-labelledby="eesh-domains">
      <div className={styles.sectionHead}><h2 id="eesh-domains">Сэдвийн оноо жилээр</h2><p>Нэг mock-д тухайн чиглэлээс дунджаар хэдэн оноо ирсэн бэ (100 онооноос). Сүүлийн багана: эхний 3 жил ба сүүлийн 3 жилийн дунджийн зөрүү.</p></div>
      <div className={styles.scroll}><table className={`${styles.table} ${styles.heat}`}>
        <thead><tr><th scope="col">Чиглэл</th>{years.map(year => <th key={year} scope="col" className={styles.cellHead}>{year}</th>)}<th scope="col">{span.early} → {span.late}</th></tr></thead>
        <tbody>{insights.domains.map(domain => {
          const delta = Math.round((domain.late - domain.early) * 10) / 10;
          return <tr key={domain.name}>
            <th scope="row">{domain.name}</th>
            {years.map(year => { const value = domain.points[String(year)] ?? 0; return <td key={year} className={styles.cell} style={shade(value)} data-zero={value ? undefined : ""}>{value || "·"}</td>; })}
            <td className={styles.trend}>{domain.early} → {domain.late} <span className={delta >= 2 ? styles.up : delta <= -2 ? styles.down : styles.flat}>{signed(delta)}</span></td>
          </tr>;
        })}</tbody>
      </table></div>
      <p className={styles.note}>{insights.note}</p>
    </section>

    <section className={styles.section} aria-labelledby="eesh-topics">
      <div className={styles.sectionHead}><h2 id="eesh-topics">Хамгийн их давтагддаг даалгавар</h2>
        <p>Жил бүрийн хувилбарт хэдэн удаа гарсан, сүүлийн 3 жилд дунджаар хэдэн оноо авсан. Цэг бүр нэг он.</p></div>
      <ol className={styles.topics}>{insights.topics.slice(0, 10).map(topicRow)}</ol>
      {insights.topics.length > 10 ? <details className={styles.more}><summary>Бусад {insights.topics.length - 10} сэдэв</summary><ol className={styles.topics} start={11}>{insights.topics.slice(10).map((topic, i) => topicRow(topic, i + 10))}</ol></details> : null}
    </section>

    {signedIn ? <section className={styles.section} aria-labelledby="eesh-weak">
      <div className={styles.sectionHead}><h2 id="eesh-weak">Таны сул сэдэв</h2><p>{label} хичээлийн mock-уудын дадлага болон энэ дасгалд шалгасан хариултаас. Хамгийн бага хувьтай нь эхэнд.</p></div>
      {weakTopics.length || weakDomains.length ? <ul className={styles.weak}>{(weakTopics.length ? weakTopics.map(item => ({ key: item.id, name: item.label, href: drillHref(subject, "topic:" + item.id), ...item }))
        : weakDomains.map(item => ({ key: item.name, href: drillHref(subject, "domain:" + item.name), ...item }))).map(item => <li key={item.key} className={styles.weakCard}>
          <strong>{item.name}</strong>
          <div className={styles.bar} role="img" aria-label={`${pct(item.correct, item.checked)}% зөв`}><span style={{ width: pct(item.correct, item.checked) + "%" }} /></div>
          <div className={styles.weakFoot}><span>{item.correct}/{item.checked} зөв · {pct(item.correct, item.checked)}%</span><Link className={styles.drillLink} href={item.href} prefetch={false}>Дасгал</Link></div>
        </li>)}</ul>
        : <p className={styles.empty}>{progress?.checked ? `Одоогоор ${progress.checked} хариулт шалгасан. Нэг сэдэвт 3-аас дээш хариулт шалгавал энд гарна.` : "Mock-ийн дадлага эсвэл доорх дасгалд хариулт шалгах тусам таны сэдэв бүрийн гүйцэтгэл энд гарна."}</p>}
    </section> : null}

    <section className={styles.section} aria-labelledby="eesh-drill">
      <div className={styles.sectionHead}><h2 id="eesh-drill">Сэдвээр дасгал</h2><p>Нэг сэдвийн 10 асуулт өөр өөр оны mock-оос. Хариу бүрийг шалгаад тайлбарыг нь уншина; хариулт тухайн mock-ийн дадлагад хадгалагдана.</p></div>
      <div className={styles.launch}>
        <p className={styles.access}>{!signedIn ? "Нэвтэрч орсны дараа дасгал хийнэ. Үнэгүй бүртгэлд үнэгүй туршилтын асуултаас чиглэлээр дасгал нээлттэй."
          : open ? `Таны нээлттэй ${open}/${insights.papers} mock-оос сэдэв сонгож 10 асуулт авна. Шалгасан асуулт дахин гарахгүй.`
            : `Үнэгүй туршилтаас чиглэлээр. Бүх ${insights.papers} mock-оос сэдвээр дасгал хийхэд ЭЕШ багц эсвэл тухайн mock-ийн эрх хэрэгтэй.`}</p>
        <Link className="button" href={drillHref(subject)} prefetch={false}>Дасгал нээх →</Link>
      </div>
    </section>
    <p className={styles.note}>Тоо баримт энэ сайтын ЭЕШ mock-уудаас: тэдгээр нь тухайн оны албан ёсны хувилбарын бүтэц, сэдвийн дарааллаар зохиогдсон. Албан ёсны статистик биш.</p>
  </div>;
}

/** The drill page (/labs/eesh/<subject>/drill, owner request 2026-11-20: «Дасгал» opens its own page): the topic or area
 * the address names, its facts, and the drill. A topic this account cannot drill (a free account) gets a plan notice and the
 * picker of what it can drill. */
export function EeshDrillView({ insights, signedIn, open, initial }: { insights: EeshInsights; signedIn: boolean; open: number; initial?: string }) {
  const { subject, label, years } = insights;
  const choices = drillChoices(insights);
  const chosen = choices.find(choice => choice.value === initial);
  const locked = Boolean(signedIn && chosen && !(open ? chosen.count : chosen.free));
  const topic = chosen && initial?.startsWith("topic:") ? insights.topics.find(item => "topic:" + item.id === initial) : undefined;
  const title = !chosen || locked ? "Сэдвээр дасгал" : topic ? topic.label : chosen.value.slice("domain:".length);
  return <div className={`wsp-page ${styles.page}`}>
    <Link className={styles.back} href={"/labs/eesh/" + subject} prefetch={false}>← {label} · ЭЕШ</Link>
    <header className={styles.head}>
      <p className={styles.eyebrow}>ЭЕШ · {label} · Сэдвээр дасгал</p>
      <h1>{title}</h1>
      {topic && !locked ? <div className={styles.topicMeta}>
        <span>{topic.domain}</span>
        <span className={styles.dots} aria-hidden="true">{years.map(year => <i key={year} className={styles.dot} data-on={topic.years.includes(year) ? "" : undefined} title={String(year)} />)}</span>
        <span>{topic.years.length}/{years.length} жил гарсан · сүүлийн 3 жилд ≈ {topic.recent} оноо</span>
        <span>{topic.drill} асуулт дасгалд</span>
      </div> : null}
      <p>Нэг сэдвийн 10 асуулт өөр өөр оны mock-оос. Хариу бүрийг шалгаад тайлбарыг нь уншина; хариулт тухайн mock-ийн дадлагад хадгалагдана.</p>
    </header>
    {locked && chosen ? <p className={styles.notice}>«{chosen.label}» сэдвээр дасгал хийхэд <Link href="/workspace/plans">ЭЕШ багц</Link> эсвэл тухайн mock-ийн эрх хэрэгтэй. Үнэгүй туршилтаас доорх чиглэлээр дасгал хийж болно.</p> : null}
    <section id="drill" className={styles.section} aria-label="Дасгал">
      {/* Keyed by the address: another topic is a client navigation to this page, so a new value remounts the drill and loads it. */}
      <EeshDrill key={initial ?? ""} subject={subject} choices={choices} signedIn={signedIn} open={open} total={insights.papers} initial={initial} />
    </section>
    <p className={styles.note}>Асуулт бүр энэ сайтын ЭЕШ mock-оос; хариу, тайлбар нь тухайн mock-ийн дадлагынхтай ижил.</p>
  </div>;
}
