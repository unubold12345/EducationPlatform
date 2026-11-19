"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "@/modules/workspace/icons";
import styles from "./dashboard.module.css";
import { addDays, daysBetween, mnDate, nextJlptDay } from "./dates";
import { GOAL_EXAMS, GOAL_LIMITS, findGoalExam, findGoalLevel, goalHub, goalTitle, mainGoal, type Goal, type GoalExam } from "./exams";
import { examInfo, INFO_CHECKED } from "./exam-info";
import { taskIdeas, type Task } from "./tasks";
import type { ActivityGrid } from "./activity";
import type { CreditOverview, GoalProgress } from "./types";
import { send } from "./send";
import { TaskCarousel } from "./task-carousel";
import { ActivityHeatmap } from "./activity-grid";
import { CreditHistory } from "./credit-history";

type Props = {
  name: string; today: string;
  goals: Goal[]; progress: Record<string, GoalProgress>;
  tasks: Task[]; range: { from: string; to: string };
  grid: ActivityGrid; credits: CreditOverview;
};

/** The student dashboard: exam goal with countdown, day-by-day to-do carousel, activity grid, exam facts and credit history. */
export function Dashboard({ name, today, goals: initialGoals, progress, tasks, range, grid, credits }: Props) {
  const router = useRouter();
  const [goals, setGoals] = useState(initialGoals);
  const [selected, setSelected] = useState<string | null>(() => mainGoal(initialGoals, today)?.id ?? null);
  const [editing, setEditing] = useState<string | null>(initialGoals.length ? null : "new");
  const [error, setError] = useState("");
  const goal = goals.find(item => item.id === selected) ?? mainGoal(goals, today);

  function saved(next: Goal) {
    setGoals(list => list.some(item => item.id === next.id) ? list.map(item => (item.id === next.id ? next : item)) : [...list, next]);
    setSelected(next.id);
    setEditing(null);
    // Mock counts and scores for a new level come from the server.
    router.refresh();
  }
  async function remove(target: Goal) {
    if (!confirmed(`«${goalTitle(target.exam, target.level)}»-г хасах уу?`)) return;
    setError("");
    try {
      await send(`/api/workspace/dashboard/goals/${encodeURIComponent(target.id)}`, "DELETE");
      const rest = goals.filter(item => item.id !== target.id);
      setGoals(rest);
      setSelected(mainGoal(rest, today)?.id ?? null);
      if (!rest.length) setEditing("new");
    } catch (failure) { setError((failure as Error).message); }
  }
  async function setDate(target: Goal, examDate: string) {
    setError("");
    try { saved(await send<Goal>(`/api/workspace/dashboard/goals/${encodeURIComponent(target.id)}`, "PATCH", { exam: target.exam, level: target.level, examDate })); }
    catch (failure) { setError((failure as Error).message); }
  }

  const editingGoal = editing && editing !== "new" ? goals.find(item => item.id === editing) ?? null : null;
  return <div className={"wsp-page " + styles.page}>
    <header className={styles.head}>
      <div>
        <p className={styles.hello}>Сайн уу, {name.trim().slice(0, 60)}</p>
        <h1>Хянах самбар</h1>
      </div>
      <p className={styles.today}><Icon name="calendar" size={16} />{mnDate(today, true)}</p>
    </header>

    <section className={styles.hero} aria-label="Миний шалгалт">
      {goals.length ? <div className={styles.goalTabs}>
        {goals.map(item => {
          const days = item.examDate ? daysBetween(today, item.examDate) : null;
          return <button key={item.id} type="button" className={styles.goalTab} aria-pressed={!editing && item.id === goal?.id} onClick={() => { setSelected(item.id); setEditing(null); }}>
            <span>{goalTitle(item.exam, item.level)}</span>
            {days !== null && days >= 0 ? <small>{days === 0 ? "Өнөөдөр" : days + " хоног"}</small> : null}
          </button>;
        })}
        {goals.length < GOAL_LIMITS.max ? <button type="button" className={styles.goalTab + " " + styles.addTab} aria-pressed={editing === "new"} onClick={() => setEditing("new")}><Icon name="plus" size={15} />Шалгалт нэмэх</button> : null}
      </div> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {editing ? <GoalForm key={editing} goal={editingGoal} goals={goals} today={today} onSaved={saved} onCancel={goals.length ? () => setEditing(null) : null} />
        : goal ? <GoalCard goal={goal} today={today} progress={progress[goal.id]} onEdit={() => setEditing(goal.id)} onRemove={() => remove(goal)} onDate={day => setDate(goal, day)} /> : null}
    </section>

    <TaskCarousel today={today} from={range.from} to={range.to} initial={tasks} ideas={taskIdeas(goal?.exam ?? null)} />
    <ActivityHeatmap grid={grid} />
    {goal ? <ExamInfoPanel goal={goal} today={today} /> : null}
    <CreditHistory data={credits} />
  </div>;
}

// The in-app browser and some embedded views answer confirm() with false; the dashboard still works there.
function confirmed(message: string) {
  try { return globalThis.confirm(message); } catch { return true; }
}

function GoalCard({ goal, today, progress, onEdit, onRemove, onDate }: {
  goal: Goal; today: string; progress: GoalProgress | undefined;
  onEdit: () => void; onRemove: () => void; onDate: (day: string) => void;
}) {
  const meta = findGoalExam(goal.exam)!;
  const level = findGoalLevel(goal.exam, goal.level)!;
  const title = goalTitle(goal.exam, goal.level);
  const info = examInfo(goal.exam, goal.level, today);
  const nextJlpt = goal.exam === "jlpt" ? nextJlptDay(today) : null;
  const workshop = goal.exam === "eesh" ? `/labs/eesh/${goal.level}` : meta.workshop;
  const value = (number: number | null | undefined, suffix = "") => (number === null || number === undefined ? "—" : number + suffix);
  return <div className={styles.goalCard} data-tone={meta.tone}>
    <div className={styles.goalMain}>
      <p className={styles.eyebrow}>{meta.label} · {meta.levelLabel}: {level.label}</p>
      <h2>{title}</h2>
      <p className={styles.organizer}>{info.organizer}</p>
      <p className={styles.goalDate}><Icon name="calendar" size={17} />{goal.examDate ? mnDate(goal.examDate, true) : "Шалгалтын өдөр товлоогүй"}</p>
      {!goal.examDate && nextJlpt ? <button type="button" className={styles.suggest} onClick={() => onDate(nextJlpt)}>Дараагийн JLPT: {mnDate(nextJlpt, true)} · тохируулах</button> : null}
      <div className={styles.goalActions}>
        <button type="button" className="wsp-ghost" onClick={onEdit}><Icon name="settings" size={16} />{goal.examDate ? "Засах" : "Огноо, түвшин засах"}</button>
        <button type="button" className={styles.quiet} onClick={onRemove}><Icon name="trash" size={16} />Хасах</button>
      </div>
    </div>
    <Countdown today={today} examDate={goal.examDate} />
    <dl className={styles.goalStats}>
      <div><dt>Манай mock</dt><dd>{level.onSite ? value(progress?.mocks) : "—"}</dd></div>
      <div><dt>Өгсөн mock</dt><dd>{value(progress?.finished)}</dd></div>
      <div><dt>Дундаж оноо</dt><dd>{value(progress?.average, "%")}</dd></div>
      <div><dt>Дадлагын горим</dt><dd>{value(progress?.practice)}</dd></div>
    </dl>
    <div className={styles.goalLinks}>
      <Link className="wsp-primary" href={goalHub(goal.exam, goal.level)}>{level.onSite ? "Mock өгөх" : "Mock-ууд"}<Icon name="arrow" size={17} /></Link>
      {workshop ? <Link className="wsp-link" href={workshop}><Icon name="workshop" size={15} />Workshop</Link> : null}
      <Link className="wsp-link" href="/workspace/review"><Icon name="review" size={15} />Миний үр дүн</Link>
    </div>
    {!level.onSite ? <p className={styles.offsite}>{title}-ийн mock манай сайтад одоогоор алга. Доорх мэдээлэл, хийх зүйлсийн жагсаалтаа ашиглаарай.</p> : null}
  </div>;
}

function Countdown({ today, examDate }: { today: string; examDate: string | null }) {
  if (!examDate) return <div className={styles.count} data-state="none"><strong>—</strong><span>Огноо товлоогүй</span></div>;
  const days = daysBetween(today, examDate);
  if (days < 0) return <div className={styles.count} data-state="past"><Icon name="check" size={30} /><span>Шалгалт өнгөрсөн</span><small>Шинэ огноо оруулах эсвэл хасах</small></div>;
  if (days === 0) return <div className={styles.count} data-state="today"><strong>Өнөөдөр</strong><span>Амжилт хүсье!</span></div>;
  const weeks = Math.floor(days / 7), rest = days % 7;
  return <div className={styles.count} data-state={days <= 14 ? "soon" : "ahead"}>
    <strong>{days}</strong><span>хоног үлдлээ</span>
    {weeks ? <small>{weeks} долоо хоног{rest ? ` ${rest} өдөр` : ""}</small> : null}
  </div>;
}

function GoalForm({ goal, goals, today, onSaved, onCancel }: { goal: Goal | null; goals: Goal[]; today: string; onSaved: (goal: Goal) => void; onCancel: (() => void) | null }) {
  const [exam, setExam] = useState<GoalExam | null>(goal?.exam ?? null);
  const [level, setLevel] = useState<string | null>(goal?.level ?? null);
  const [booked, setBooked] = useState(Boolean(goal?.examDate));
  const [date, setDate] = useState(goal?.examDate ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const taken = (examId: string, levelId: string) => goals.some(item => item.exam === examId && item.level === levelId && item.id !== goal?.id);
  const meta = findGoalExam(exam);
  const nextJlpt = nextJlptDay(today);

  function pickExam(id: GoalExam) {
    setExam(id);
    const levels = findGoalExam(id)!.levels.filter(item => !taken(id, item.id));
    setLevel(levels.length === 1 ? levels[0].id : null);
    setError("");
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!exam || !level) { setError("Шалгалт болон " + (meta?.levelLabel.toLowerCase() ?? "түвшин") + " сонгоно уу."); return; }
    if (booked && !date) { setError("Шалгалтын өдрөө оруулна уу."); return; }
    setBusy(true);
    setError("");
    try {
      const body = { exam, level, examDate: booked ? date : null };
      onSaved(goal
        ? await send<Goal>(`/api/workspace/dashboard/goals/${encodeURIComponent(goal.id)}`, "PATCH", body)
        : await send<Goal>("/api/workspace/dashboard/goals", "POST", body));
    } catch (failure) { setError((failure as Error).message); }
    finally { setBusy(false); }
  }

  return <form className={styles.goalForm} onSubmit={submit}>
    <h2>{goal ? "Шалгалтаа засах" : "Ямар шалгалтад бэлдэж байна?"}</h2>
    <fieldset>
      <legend>Шалгалт</legend>
      <div className={styles.chips}>{GOAL_EXAMS.map(item => {
        const full = item.levels.every(entry => taken(item.id, entry.id));
        return <button key={item.id} type="button" className={styles.chip} aria-pressed={exam === item.id} disabled={full} onClick={() => pickExam(item.id)}>{item.label}</button>;
      })}</div>
    </fieldset>
    {meta ? <fieldset>
      <legend>{meta.levelLabel}</legend>
      <div className={styles.chips}>{meta.levels.map(item => <button key={item.id} type="button" className={styles.chip} aria-pressed={level === item.id} disabled={taken(meta.id, item.id)} onClick={() => { setLevel(item.id); setError(""); }}>
        {item.label}{item.onSite ? <em>mock</em> : null}
      </button>)}</div>
    </fieldset> : null}
    <fieldset>
      <legend>Шалгалтын өдөр</legend>
      <label className={styles.check}><input type="checkbox" checked={booked} onChange={event => setBooked(event.target.checked)} />Өдрөө товлосон (бүртгүүлсэн)</label>
      {booked ? <div className={styles.dateRow}>
        <input className={styles.dateInput + " " + styles.dateInputX} type="date" required min={today} max={addDays(today, GOAL_LIMITS.aheadDays)} value={date} onChange={event => setDate(event.target.value)} aria-label="Шалгалтын өдөр" />
        {exam === "jlpt" ? <button type="button" className={styles.suggest} onClick={() => setDate(nextJlpt)}>Дараагийн JLPT: {mnDate(nextJlpt)}</button> : null}
      </div> : null}
    </fieldset>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    <div className={styles.formActions}>
      <button type="submit" className="wsp-primary" disabled={busy}>{busy ? "Хадгалж байна…" : "Хадгалах"}</button>
      {onCancel ? <button type="button" className="wsp-ghost" onClick={onCancel}>Болих</button> : null}
    </div>
  </form>;
}

const NATIVE_LANG: Partial<Record<GoalExam, string>> = { jlpt: "ja", hsk: "zh", topik: "ko" };

function ExamInfoPanel({ goal, today }: { goal: Goal; today: string }) {
  const info = examInfo(goal.exam, goal.level, today);
  // Columns only for what the exam publishes (JLPT has no fixed item counts; ЭЕШ prints no per-part minutes).
  const counted = info.parts.some(part => part.items);
  const timed = info.parts.some(part => part.minutes);
  const lang = NATIVE_LANG[goal.exam];
  return <section className={styles.section} aria-labelledby="dash-info">
    <div className={styles.sectionHead}>
      <h2 id="dash-info"><Icon name="info" />{info.title}: шалгалтын тухай</h2>
      <span className={styles.muted}>Мэдээллийг шалгасан: {INFO_CHECKED}</span>
    </div>
    <div className={styles.card}>
      <p className={styles.summary}>{info.summary}</p>
      <p className={styles.muted}>Зохион байгуулагч: {info.organizer}</p>
      <dl className={styles.keyNumbers}>
        <div><dt>Нийт хугацаа</dt><dd>{info.totalTime}</dd></div>
        {info.totalItems ? <div><dt>Асуулт</dt><dd>{info.totalItems}</dd></div> : null}
        <div><dt>Оноо</dt><dd>{info.scale}</dd></div>
        {info.pass ? <div><dt>Тэнцэх</dt><dd>{info.pass}</dd></div> : null}
      </dl>
      {info.note ? <p className={styles.note}><Icon name="info" size={16} />{info.note}</p> : null}

      <h3 className={styles.subhead}>Бүтэц</h3>
      <div className={styles.tableWrap}>
        <table className={styles.parts}>
          <thead><tr><th scope="col">Хэсэг</th>{counted ? <th scope="col">Асуулт</th> : null}{timed ? <th scope="col">Минут</th> : null}</tr></thead>
          <tbody>{info.parts.map(part => <tr key={part.name + (part.native ?? "")}>
            <th scope="row">{part.native ? <span lang={lang} className={styles.native}>{part.native}</span> : null}{part.name}{part.detail ? <span className={styles.partDetail}>{part.detail}</span> : null}</th>
            {counted ? <td>{part.items ?? "—"}</td> : null}
            {timed ? <td>{part.minutes || "—"}</td> : null}
          </tr>)}</tbody>
        </table>
      </div>

      <div className={styles.infoCols}>
        <div>
          <h3 className={styles.subhead}>Оноо ба тэнцэх</h3>
          <ul className={styles.bullets}>{info.scoring.map(line => <li key={line}>{line}</li>)}</ul>
        </div>
        <div>
          <h3 className={styles.subhead}>Мэдэх зүйлс</h3>
          <dl className={styles.facts}>{info.facts.map(fact => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
        </div>
      </div>

      <h3 className={styles.subhead}>Статистик · {info.stats.title}</h3>
      {info.stats.items.length ? <dl className={styles.statTiles}>{info.stats.items.map(item => <div key={item.label}><dd>{item.value}</dd><dt>{item.label}</dt></div>)}</dl>
        : <p className={styles.muted}>{info.stats.note}</p>}
      {info.stats.source ? <p className={styles.source}>Эх сурвалж: {info.stats.source}</p> : null}

      <h3 className={styles.subhead}>Зөвлөгөө</h3>
      <ol className={styles.tips}>{info.tips.map(tip => <li key={tip}>{tip}</li>)}</ol>

      <div className={styles.infoLinks}>{info.links.map(link => link.href.startsWith("/")
        ? <Link key={link.href} className="wsp-link" href={link.href}>{link.label}<Icon name="arrow" size={15} /></Link>
        : <a key={link.href} className="wsp-link" href={link.href} target="_blank" rel="noopener noreferrer">{link.label}<Icon name="site" size={15} /></a>)}</div>
    </div>
  </section>;
}
