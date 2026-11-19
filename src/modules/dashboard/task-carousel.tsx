"use client";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/modules/workspace/icons";
import styles from "./dashboard.module.css";
import { addDays, daysBetween, mnDate, mnWeekday } from "./dates";
import { TASK_LIMITS, type Task } from "./tasks";
import { send } from "./send";

const API = "/api/workspace/dashboard/tasks";

/** One card per day from a week ago to three weeks ahead, scrolled to today; tasks are saved on the account. */
export function TaskCarousel({ today, from, to, initial, ideas }: { today: string; from: string; to: string; initial: Task[]; ideas: string[] }) {
  const [tasks, setTasks] = useState(initial);
  const [error, setError] = useState("");
  const track = useRef<HTMLDivElement>(null);
  const days = useMemo(() => {
    const list: string[] = [];
    for (let day = from; day <= to; day = addDays(day, 1)) list.push(day);
    return list;
  }, [from, to]);
  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) map.set(task.day, [...(map.get(task.day) ?? []), task]);
    return map;
  }, [tasks]);

  const jumpToToday = (smooth: boolean) => scrollToDay(track.current, today, smooth);
  // Open on today; yesterday and earlier sit to the left.
  useEffect(() => scrollToDay(track.current, today, false), [today]);

  function scroll(direction: 1 | -1) {
    const box = track.current;
    if (!box) return;
    const card = box.querySelector<HTMLElement>("[data-day]");
    box.scrollBy({ left: direction * ((card?.offsetWidth ?? 260) + 12) * 2, behavior: reducedMotion() ? "auto" : "smooth" });
  }

  async function add(day: string, title: string) {
    setError("");
    const temp: Task = { id: "temp-" + Math.random().toString(36).slice(2), day, title, done: false };
    setTasks(list => [...list, temp]);
    try {
      const saved = await send<Task>(API, "POST", { day, title });
      setTasks(list => list.map(task => (task.id === temp.id ? saved : task)));
    } catch (failure) {
      setTasks(list => list.filter(task => task.id !== temp.id));
      setError((failure as Error).message);
    }
  }
  async function toggle(target: Task) {
    if (target.id.startsWith("temp-")) return;
    setError("");
    setTasks(list => list.map(task => (task.id === target.id ? { ...task, done: !target.done } : task)));
    try { await send<Task>(`${API}/${encodeURIComponent(target.id)}`, "PATCH", { done: !target.done }); }
    catch (failure) {
      setTasks(list => list.map(task => (task.id === target.id ? { ...task, done: target.done } : task)));
      setError((failure as Error).message);
    }
  }
  async function remove(target: Task) {
    if (target.id.startsWith("temp-")) return;
    setError("");
    setTasks(list => list.filter(task => task.id !== target.id));
    try { await send(`${API}/${encodeURIComponent(target.id)}`, "DELETE"); }
    catch (failure) {
      setTasks(list => [...list, target]);
      setError((failure as Error).message);
    }
  }

  const todayTasks = byDay.get(today) ?? [];
  const todayDone = todayTasks.filter(task => task.done).length;
  return <section className={styles.section} aria-labelledby="dash-todo">
    <div className={styles.sectionHead}>
      <h2 id="dash-todo"><Icon name="check" />Хийх зүйлс</h2>
      <span className={styles.muted}>{todayTasks.length ? `Өнөөдөр ${todayDone}/${todayTasks.length} хийсэн` : "Өнөөдөр ажил бичээгүй"}</span>
      <div className={styles.carouselNav}>
        <button type="button" className={styles.iconButton} onClick={() => scroll(-1)} aria-label="Өмнөх өдрүүд"><Icon name="back" size={18} /></button>
        <button type="button" className={styles.todayButton} onClick={() => jumpToToday(true)}>Өнөөдөр</button>
        <button type="button" className={styles.iconButton} onClick={() => scroll(1)} aria-label="Дараагийн өдрүүд"><Icon name="arrow" size={18} /></button>
      </div>
    </div>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    <div className={styles.track} ref={track} role="list" aria-label="Өдрүүд">
      {days.map((day, index) => <DayCard key={day} day={day} today={today} tasks={byDay.get(day) ?? []}
        ideas={[ideas[index % ideas.length], ideas[(index + 1) % ideas.length]]} onAdd={add} onToggle={toggle} onRemove={remove} />)}
    </div>
  </section>;
}

/** The track is the cards' offset parent (position: relative), so a card's offsetLeft is its scroll position. */
function scrollToDay(box: HTMLElement | null, day: string, smooth: boolean) {
  const card = box?.querySelector<HTMLElement>(`[data-day="${day}"]`);
  if (!box || !card) return;
  box.scrollTo({ left: Math.max(0, card.offsetLeft - 4), behavior: smooth && !reducedMotion() ? "smooth" : "auto" });
}

function reducedMotion() {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function DayCard({ day, today, tasks, ideas, onAdd, onToggle, onRemove }: {
  day: string; today: string; tasks: Task[]; ideas: string[];
  onAdd: (day: string, title: string) => void; onToggle: (task: Task) => void; onRemove: (task: Task) => void;
}) {
  const [text, setText] = useState("");
  const list = useRef<HTMLUListElement>(null);
  const count = useRef(tasks.length);
  // A task added to a full card lands below the fold: bring the list's end into view.
  useEffect(() => {
    if (tasks.length > count.current && list.current) list.current.scrollTop = list.current.scrollHeight;
    count.current = tasks.length;
  }, [tasks.length]);
  const offset = daysBetween(today, day);
  const tag = offset === 0 ? "Өнөөдөр" : offset === 1 ? "Маргааш" : offset === -1 ? "Өчигдөр" : null;
  const done = tasks.filter(task => task.done).length;
  const full = tasks.length >= TASK_LIMITS.perDay;
  function submit(event: FormEvent) {
    event.preventDefault();
    const title = text.replace(/\s+/g, " ").trim();
    if (!title || full) return;
    onAdd(day, title);
    setText("");
  }
  return <article role="listitem" data-day={day} className={styles.day} data-today={offset === 0 ? "" : undefined} data-past={offset < 0 ? "" : undefined} aria-label={`${mnWeekday(day)}, ${mnDate(day)}`}>
    <header className={styles.dayHead}>
      <div><strong>{mnWeekday(day)}</strong><span>{mnDate(day)}</span></div>
      {tag ? <em>{tag}</em> : null}
    </header>
    {tasks.length ? <div className={styles.dayProgress} aria-label={`${done} / ${tasks.length} хийсэн`}>
      <i aria-hidden="true"><b style={{ width: Math.round((done / tasks.length) * 100) + "%" }} /></i><span>{done}/{tasks.length}</span>
    </div> : null}
    {tasks.length ? <ul ref={list} className={styles.taskList}>{tasks.map(task => <li key={task.id} data-done={task.done ? "" : undefined}>
      <label><input type="checkbox" checked={task.done} onChange={() => onToggle(task)} /><span>{task.title}</span></label>
      <button type="button" className={styles.taskRemove} onClick={() => onRemove(task)} aria-label={`«${task.title}» устгах`}><Icon name="close" size={14} /></button>
    </li>)}</ul>
      : offset >= 0 ? <div className={styles.ideas}>{ideas.map(idea => <button key={idea} type="button" onClick={() => onAdd(day, idea)}><Icon name="plus" size={13} />{idea}</button>)}</div>
        : <p className={styles.dayEmpty}>Ажил бичээгүй</p>}
    <form className={styles.taskForm} onSubmit={submit}>
      <input className={styles.taskInput + " " + styles.taskInputX} value={text} onChange={event => setText(event.target.value)} maxLength={TASK_LIMITS.title}
        placeholder={full ? "Өдрийн дээд хэмжээ" : "Ажил нэмэх…"} aria-label={`${mnDate(day)}-нд ажил нэмэх`} disabled={full} />
      <button type="submit" className={styles.taskAdd} disabled={!text.trim() || full} aria-label="Нэмэх"><Icon name="plus" size={16} /></button>
    </form>
  </article>;
}
