"use client";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/modules/workspace/icons";
import { failure, readStored, sendJson, writeStored } from "@/modules/vocabulary/api";
import type { StudyUpdate } from "@/modules/vocabulary/contracts";
import { speak } from "@/modules/vocabulary/speech";
import { DECK_REVIEW_WORDS } from "./catalog";
import { buildDrill, instruction, pickTargets, rightAnswer, typedMatches, type DrillDomain, type DrillFocus, type DrillItem, type DrillKind, type Exercise } from "./drill";
import styles from "./drill.module.css";

// The Workshop quiz (owner request 2026-11-18, "like Duolingo"): a quiz maker, then one short exercise per screen with a
// Check button, a green/red answer bar, missed exercises coming back at the end, and a result screen. Kana, the word decks
// and the Pinyin tone drill all use it; grades go to the deck review route.

/** `count` 0 = every word of the chosen groups. */
export type DrillConfig = { groups: string[]; count: number; kinds: DrillKind[]; focus: DrillFocus };
export type MakerGroup = { id: string; label: string; section?: string; count: number; lang?: string };
export type DrillSessionState = { exercises: Exercise[]; startedAt: number; config: DrillConfig; ids: string[] | null };
type Setup = { domain: DrillDomain; pool: DrillItem[]; showReading: boolean; lookalikes?: readonly string[] };

const KIND_LABEL: Record<DrillKind, [string, string]> = {
  meaning: ["Утга сонгох", "Үгийг хараад утгыг нь"], term: ["Үг сонгох", "Утгыг хараад үгийг нь"], listen: ["Сонсох", "Сонсоод сонгох"],
  match: ["Хос олох", "Таван хосыг холбох"], type: ["Бичих", "Дуудлагыг нь бичих"], build: ["Бүрдүүлэх", "Хэсгүүдээр угсрах"],
  cloze: ["Өгүүлбэр", "Хоосон зайг нөхөх"], tone: ["Аялгуу", "Аялгууг таних"],
};
const KANA_LABEL: Partial<Record<DrillKind, [string, string]>> = { meaning: ["Дуудлага сонгох", "Үсгийг хараад romaji-г нь"], term: ["Үсэг сонгох", "Romaji-г хараад үсгийг нь"] };
const FOCUS: { id: DrillFocus; label: string }[] = [{ id: "smart", label: "Ухаалаг" }, { id: "new", label: "Шинэ" }, { id: "weak", label: "Сул" }, { id: "all", label: "Бүгд" }];
const PRAISE = ["Зөв!", "Гайхалтай!", "Яг зөв!", "Сайн байна!"];
const secondsSince = (start: number) => Math.round((Date.now() - start) / 1000);

/** Start a session from a click handler (time and randomness belong in handlers, not in render). */
export function startDrill(setup: Setup, config: DrillConfig, ids: string[] | null = null): DrillSessionState {
  const now = Date.now();
  const chosen = new Set(config.groups);
  const candidates = ids ? setup.pool.filter(item => ids.includes(item.id)) : setup.pool.filter(item => chosen.has(item.group));
  const targets = pickTargets(candidates, config.focus, config.count, now);
  return { exercises: buildDrill(targets, setup.pool, { domain: setup.domain, kinds: config.kinds, showReading: setup.showReading, lookalikes: setup.lookalikes }), startedAt: now, config, ids };
}

/** The maker, then the session, then the results; `initial` skips the maker (today's review, look-alikes). */
export function DrillFlow({ setup, title, groups, groupLabel, initialGroups, kinds, counts = [5, 10, 20, 30, 50, 0], storageKey, lang, voiced, reviewUrl, initial, onStudied, onClose }: {
  setup: Setup; title: string; groups: MakerGroup[]; groupLabel: string; initialGroups: string[]; kinds: DrillKind[]; counts?: number[]; storageKey: string;
  lang: string; voiced: boolean; reviewUrl: string; initial?: DrillSessionState | null; onStudied: (updates: StudyUpdate[]) => void; onClose: () => void;
}) {
  const [session, setSession] = useState<DrillSessionState | null>(initial ?? null);
  if (!session) {
    return <DrillMaker title={title} domain={setup.domain} groups={groups} groupLabel={groupLabel} initialGroups={initialGroups} kinds={kinds} counts={counts}
      storageKey={storageKey} pool={setup.pool} onExit={onClose} onStart={config => setSession(startDrill(setup, config))} />;
  }
  return <DrillSession key={session.startedAt} domain={setup.domain} session={session} pool={setup.pool} lang={lang} voiced={voiced} reviewUrl={reviewUrl}
    onStudied={onStudied} onExit={onClose} onAgain={() => setSession(startDrill(setup, session.config, session.ids))} onSetup={() => setSession(null)} />;
}

function DrillMaker({ title, domain, groups, groupLabel, initialGroups, kinds, counts, storageKey, pool, onStart, onExit }: {
  title: string; domain: DrillDomain; groups: MakerGroup[]; groupLabel: string; initialGroups: string[]; kinds: DrillKind[]; counts: number[]; storageKey: string;
  pool: DrillItem[]; onStart: (config: DrillConfig) => void; onExit: () => void;
}) {
  // The last settings are kept per browser (the maker only renders after a click, so this never runs on the server).
  const [stored] = useState(() => readStored<Partial<DrillConfig>>("drill:" + storageKey) ?? {});
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set(initialGroups.length ? initialGroups : groups.slice(0, 1).map(group => group.id)));
  const [count, setCount] = useState(stored.count !== undefined && counts.includes(stored.count) ? stored.count : counts[Math.min(1, counts.length - 1)]);
  const [picked, setPicked] = useState<ReadonlySet<DrillKind>>(new Set((stored.kinds ?? kinds).filter(kind => kinds.includes(kind)).length ? (stored.kinds ?? kinds).filter(kind => kinds.includes(kind)) : kinds));
  const [focus, setFocus] = useState<DrillFocus>(stored.focus ?? "smart");
  const label = (kind: DrillKind) => (domain === "kana" ? KANA_LABEL[kind] : undefined) ?? KIND_LABEL[kind];
  const available = pool.filter(item => chosen.has(item.group)).length;
  const sections = [...new Set(groups.map(group => group.section ?? ""))];
  const toggle = <T,>(set: ReadonlySet<T>, value: T) => { const next = new Set(set); if (next.has(value)) next.delete(value); else next.add(value); return next; };
  const ready = available > 0 && picked.size > 0;

  function start() {
    const config: DrillConfig = { groups: [...chosen], count, kinds: kinds.filter(kind => picked.has(kind)), focus };
    writeStored("drill:" + storageKey, { count, kinds: config.kinds, focus });
    onStart(config);
  }

  return <div className={`wsp-page ${styles.page}`}>
    <button type="button" className={styles.back} onClick={onExit}><Icon name="back" size={18} />Буцах</button>
    <section className={styles.maker} aria-labelledby="drill-maker-heading">
      <header className={styles.makerHead}>
        <span className={styles.makerMark} aria-hidden="true"><Icon name="bolt" size={26} /></span>
        <div><p className={styles.kicker}>QUIZ ҮҮСГЭХ</p><h1 id="drill-maker-heading">{title}</h1></div>
      </header>

      <div className={styles.block} role="group" aria-label={groupLabel}>
        <div className={styles.blockHead}><span>{groupLabel}</span>
          <button type="button" className={styles.textButton} onClick={() => setChosen(chosen.size === groups.length ? new Set() : new Set(groups.map(group => group.id)))}>
            {chosen.size === groups.length ? "Цэвэрлэх" : "Бүгдийг сонгох"}</button></div>
        {sections.map(section => <div key={section} className={styles.groupSection}>
          {section ? <small>{section}</small> : null}
          <div className={styles.groupChips}>{groups.filter(group => (group.section ?? "") === section).map(group =>
            <button key={group.id} type="button" aria-pressed={chosen.has(group.id)} onClick={() => setChosen(toggle(chosen, group.id))} lang={group.lang}>
              {group.label}<small>{group.count}</small></button>)}</div>
        </div>)}
      </div>

      {kinds.length > 1 ? <div className={styles.block} role="group" aria-label="Дасгалын төрөл">
        <div className={styles.blockHead}><span>Дасгалын төрөл</span></div>
        <div className={styles.kindGrid}>{kinds.map(kind => <button key={kind} type="button" aria-pressed={picked.has(kind)} onClick={() => setPicked(toggle(picked, kind))}>
          <strong>{label(kind)[0]}</strong><small>{label(kind)[1]}</small></button>)}</div>
      </div> : null}

      <div className={styles.makerRow}>
        <div className={styles.block} role="group" aria-label="Асуултын тоо">
          <div className={styles.blockHead}><span>Асуулт</span></div>
          <div className={styles.segment}>{counts.map(value => <button key={value} type="button" aria-pressed={count === value} onClick={() => setCount(value)}>{value || "Бүгд"}</button>)}</div>
        </div>
        <div className={styles.block} role="group" aria-label="Аль үгсийг">
          <div className={styles.blockHead}><span>Аль {domain === "kana" ? "үсгийг" : "үгсийг"}</span></div>
          <div className={styles.segment}>{FOCUS.map(item => <button key={item.id} type="button" aria-pressed={focus === item.id} onClick={() => setFocus(item.id)}>{item.label}</button>)}</div>
        </div>
      </div>

      <footer className={styles.makerFoot}>
        <span>{ready ? `${count > 0 ? Math.min(count, available) : available} асуулт · ${available} ${domain === "kana" ? "үсгээс" : "үгнээс"}` : "Нэг ч хэсэг эсвэл төрөл сонгоогүй байна."}</span>
        <button type="button" className={styles.primary} disabled={!ready} onClick={start}>Эхлэх</button>
      </footer>
    </section>
  </div>;
}

type Verdict = { right: boolean; praise: string };

function DrillSession({ domain, session, pool, lang, voiced, reviewUrl, onStudied, onExit, onAgain, onSetup }: {
  domain: DrillDomain; session: DrillSessionState; pool: DrillItem[]; lang: string; voiced: boolean; reviewUrl: string;
  onStudied: (updates: StudyUpdate[]) => void; onExit: () => void; onAgain: () => void; onSetup: () => void;
}) {
  const [queue, setQueue] = useState(session.exercises);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const [built, setBuilt] = useState<number[]>([]);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [missed, setMissed] = useState<ReadonlySet<string>>(new Set());
  const [firstTry, setFirstTry] = useState(0);
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(0);
  const [matched, setMatched] = useState<ReadonlySet<string>>(new Set());
  const [leftPick, setLeftPick] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  // Items mixed up in the current pairs round.
  const [flashedIn, setFlashedIn] = useState<ReadonlySet<string>>(new Set());
  const [finished, setFinished] = useState<{ seconds: number } | null>(null);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");
  const items = useMemo(() => new Map(pool.map(item => [item.id, item])), [pool]);
  const current: Exercise | undefined = queue[index];
  const total = queue.length;
  const retry = current ? current.key.endsWith("r") : false;

  // Listening and tone exercises play their word as they appear.
  const autoSpeak = current && (current.kind === "listen" || current.kind === "tone") ? current.speak : null;
  const currentKey = current?.key;
  useEffect(() => { if (currentKey && autoSpeak && voiced) speak(autoSpeak, lang); }, [currentKey, autoSpeak, voiced, lang]);

  const canCheck = !verdict && current !== undefined && current.kind !== "match" && (
    current.kind === "type" ? typed.trim().length > 0 : current.kind === "build" ? built.length > 0 : picked !== null);

  function judge(right: boolean, itemIds: string[]) {
    if (!current) return;
    setVerdict({ right, praise: PRAISE[(index + firstTry) % PRAISE.length] });
    if (right) {
      if (!retry) setFirstTry(value => value + 1);
      setCombo(combo + 1); setBest(Math.max(best, combo + 1));
    } else {
      setCombo(0);
      setMissed(previous => new Set([...previous, ...itemIds]));
      // A missed exercise comes back once at the end, as in Duolingo.
      if (!retry && current.kind !== "match") setQueue(previous => [...previous, { ...current, key: current.key + "r" }]);
    }
    if (voiced && current.kind !== "match" && current.kind !== "listen" && current.speak) speak(current.speak, lang);
  }
  function check() {
    if (!current || !canCheck) return;
    if (current.kind === "type") judge(typedMatches(typed, current.accepted), [current.itemId]);
    else if (current.kind === "build") judge(built.map(at => current.tiles[at]).join(current.joiner) === current.answer.join(current.joiner), [current.itemId]);
    else if ("options" in current) judge(picked === current.answer, [current.itemId]);
  }
  function skip() { if (current && current.kind !== "match" && !verdict) judge(false, [current.itemId]); }
  function pickRight(id: string) {
    if (!current || current.kind !== "match" || !leftPick || matched.has(id)) return;
    if (id === leftPick) {
      const next = new Set([...matched, id]);
      setMatched(next); setLeftPick(null);
      if (voiced) speak(items.get(id)?.term ?? "", lang);
      if (next.size === current.itemIds.length) judge(flashedIn.size === 0, []);
    } else {
      setFlash(id); setFlashedIn(previous => new Set([...previous, leftPick, id]));
      setMissed(previous => new Set([...previous, leftPick, id])); setCombo(0); setLeftPick(null);
      window.setTimeout(() => setFlash(null), 450);
    }
  }
  async function save(grades: { id: string; grade: "good" | "again" }[]) {
    setSaving("saving"); setError("");
    try {
      const updates: StudyUpdate[] = [];
      for (let at = 0; at < grades.length; at += DECK_REVIEW_WORDS) {
        updates.push(...(await sendJson<{ words: StudyUpdate[] }>(reviewUrl, { results: grades.slice(at, at + DECK_REVIEW_WORDS) })).words);
      }
      onStudied(updates);
      setSaving("saved");
    } catch (reason) { setSaving("idle"); setError(failure(reason, "Явцыг хадгалж чадсангүй.")); }
  }
  const grades = () => {
    const ids = [...new Set(session.exercises.flatMap(exercise => exercise.kind === "match" ? exercise.itemIds : [exercise.itemId]))];
    return ids.map(id => ({ id, grade: missed.has(id) ? "again" as const : "good" as const }));
  };
  function next() {
    if (index + 1 < queue.length) {
      setIndex(index + 1); setPicked(null); setTyped(""); setBuilt([]); setVerdict(null); setMatched(new Set()); setLeftPick(null); setFlashedIn(new Set());
      return;
    }
    setFinished({ seconds: secondsSince(session.startedAt) });
    void save(grades());
  }

  // Keys: 1–9 choose, Enter checks or continues.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (finished || !current) return;
      const inField = event.target instanceof HTMLInputElement;
      if (event.key === "Enter") { event.preventDefault(); if (verdict) next(); else check(); return; }
      if (inField || verdict || !/^[1-9]$/.test(event.key)) return;
      const at = Number(event.key) - 1;
      if ("options" in current && at < current.options.length) setPicked(at);
      if (current.kind === "build" && at < current.tiles.length && !built.includes(at)) setBuilt([...built, at]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (finished || !current) {
    const asked = new Set(session.exercises.flatMap(exercise => exercise.kind === "match" ? exercise.itemIds : [exercise.itemId]));
    const solo = session.exercises.filter(exercise => exercise.kind !== "match").length || 1;
    const accuracy = Math.round((firstTry / Math.max(1, session.exercises.length)) * 100);
    const wrong = [...asked].filter(id => missed.has(id)).map(id => items.get(id)).filter((item): item is DrillItem => Boolean(item));
    const time = finished ? `${Math.floor(finished.seconds / 60)}:${String(finished.seconds % 60).padStart(2, "0")}` : "0:00";
    return <div className={`wsp-page ${styles.page}`}>
      <section className={styles.result} aria-labelledby="drill-result-heading">
        <span className={styles.resultMark} aria-hidden="true"><Icon name={accuracy >= 80 ? "check" : "repeat"} size={30} /></span>
        <h1 id="drill-result-heading">{accuracy >= 90 ? "Гайхалтай!" : accuracy >= 60 ? "Дасгал дууслаа!" : "Дахин давтъя"}</h1>
        <dl className={styles.resultStats}>
          <div data-tone="xp"><dt>Оноо</dt><dd>{firstTry * 10 + best * 2}</dd></div>
          <div data-tone="accuracy"><dt>Нарийвчлал</dt><dd>{accuracy}%</dd></div>
          <div data-tone="time"><dt>Хугацаа</dt><dd>{time}</dd></div>
          <div data-tone="combo"><dt>Дараалан зөв</dt><dd>{best}</dd></div>
        </dl>
        <p className={styles.resultNote} aria-live="polite">{saving === "saving" ? "Явцыг хадгалж байна…" : saving === "saved" ? `Явц хадгалагдлаа: ${asked.size} ${domain === "kana" ? "үсэг" : "үг"}, ${solo} дасгал.` : ""}</p>
        {error ? <p className={styles.error} role="alert">{error} <button type="button" className={styles.textButton} onClick={() => void save(grades())}>Дахин оролдох</button></p> : null}
        {wrong.length ? <div className={styles.reviewList}><h2>Давтах {domain === "kana" ? "үсэг" : "үгс"}</h2><ul>{wrong.map(item => <li key={item.id}>
          <span lang={lang}>{item.term}</span><span>{domain === "tones" ? item.reading : item.reading ?? ""}</span><span>{item.meaning}</span>
          {voiced ? <button type="button" className={styles.iconButton} onClick={() => speak(item.term, lang)} aria-label={`${item.term} сонсох`}><Icon name="sound" size={16} /></button> : null}
        </li>)}</ul></div> : null}
        <div className={styles.resultActions}>
          <button type="button" className={styles.primary} onClick={onAgain}>Дахин</button>
          <button type="button" className={styles.secondary} onClick={onSetup}>Тохиргоо</button>
          <button type="button" className={styles.secondary} onClick={onExit}>Дуусгах</button>
        </div>
      </section>
    </div>;
  }

  const item = current.kind === "match" ? null : items.get(current.itemId) ?? null;
  const done = index + (verdict ? 1 : 0);
  return <div className={`wsp-page ${styles.page} ${styles.sessionPage}`}>
    <div className={styles.topBar}>
      <button type="button" className={styles.iconButton} onClick={onExit} aria-label="Дасгалаас гарах"><Icon name="close" size={20} /></button>
      <div className={styles.progress} role="progressbar" aria-label="Явц" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}><b style={{ width: (done / total) * 100 + "%" }} /></div>
      <span className={styles.combo} data-hot={combo >= 3 ? "true" : undefined} aria-label={`${combo} дараалан зөв`}><Icon name="flame" size={18} />{combo}</span>
    </div>

    <section className={styles.exercise} aria-labelledby="drill-instruction" data-kind={current.kind}>
      {retry ? <p className={styles.retryTag}>Өмнөх алдаа</p> : null}
      <h1 id="drill-instruction" className={styles.instruction}>{instruction(domain, current.kind)}</h1>

      {current.kind === "match" ? <div className={styles.matchGrid}>
        <div role="group" aria-label="Зүүн тал">{current.left.map(side => <button key={side.id} type="button" lang={lang} disabled={matched.has(side.id)}
          aria-pressed={leftPick === side.id} data-done={matched.has(side.id) ? "true" : undefined} onClick={() => setLeftPick(side.id)}>{side.text}</button>)}</div>
        <div role="group" aria-label="Баруун тал">{current.right.map(side => <button key={side.id} type="button" disabled={matched.has(side.id) || !leftPick}
          data-done={matched.has(side.id) ? "true" : undefined} data-wrong={flash === side.id ? "true" : undefined} onClick={() => pickRight(side.id)}>{side.text}</button>)}</div>
      </div> : <>
        <div className={styles.prompt}>
          {current.kind === "listen" ? <button type="button" className={styles.bigSpeak} onClick={() => current.speak && speak(current.speak, lang)} aria-label="Дахин сонсох"><Icon name="sound" size={34} /></button>
            : <div className={styles.promptText} data-prompt="" data-size={current.kind === "cloze" ? "sentence" : [...current.prompt].length <= 3 ? "big" : undefined}
              lang={current.kind === "term" || (current.kind === "build" && (domain === "hsk" || current.prompt === item?.meaning)) ? undefined : lang}>{current.prompt}</div>}
          {current.sub ? <p className={styles.promptSub}>{current.sub}</p> : null}
          {current.kind !== "listen" && current.speak && voiced && current.kind !== "type" ? <button type="button" className={styles.iconButton} onClick={() => speak(current.speak!, lang)} aria-label="Сонсох"><Icon name="sound" size={18} /></button> : null}
        </div>

        {"options" in current ? <div className={styles.options} role="group" aria-label="Хариултууд" data-wide={current.kind === "meaning" ? "true" : undefined}>
          {current.options.map((option, at) => <button key={option.text} type="button" disabled={Boolean(verdict)} aria-pressed={picked === at} onClick={() => setPicked(at)}
            data-state={verdict ? (at === current.answer ? "right" : at === picked ? "wrong" : "dim") : undefined}
            lang={current.kind === "meaning" ? undefined : current.kind === "tone" ? "zh-Latn-pinyin" : lang}>
            <kbd aria-hidden="true">{at + 1}</kbd><span>{option.text}{option.sub ? <small>{option.sub}</small> : null}</span>
          </button>)}
        </div> : null}

        {current.kind === "type" ? <input className={styles.typeInput} value={typed} onChange={event => setTyped(event.target.value)} disabled={Boolean(verdict)} autoFocus
          aria-label="Хариулт" placeholder={domain === "hsk" ? "жишээ нь: xuesheng" : "жишээ нь: ka"} autoComplete="off" autoCapitalize="off" spellCheck={false}
          data-state={verdict ? (verdict.right ? "right" : "wrong") : undefined} /> : null}

        {current.kind === "build" ? <div className={styles.build}>
          <div className={styles.buildLine} aria-label="Таны хариулт" lang={lang}>{built.map((at, position) => <button key={position} type="button" disabled={Boolean(verdict)}
            onClick={() => setBuilt(built.filter((_, other) => other !== position))}>{current.tiles[at]}</button>)}</div>
          <div className={styles.tiles} role="group" aria-label="Хэсгүүд" lang={lang}>{current.tiles.map((tile, at) => <button key={at} type="button" disabled={Boolean(verdict) || built.includes(at)}
            data-used={built.includes(at) ? "true" : undefined} onClick={() => setBuilt([...built, at])}>{tile}</button>)}</div>
        </div> : null}
      </>}
    </section>

    <footer className={styles.answerBar} data-state={verdict ? (verdict.right ? "right" : "wrong") : undefined} aria-live="polite">
      <div className={styles.answerText}>
        {verdict ? <>
          <strong><Icon name={verdict.right ? "check" : "close"} size={20} />{verdict.right ? verdict.praise : current.kind === "match" ? "Хэд хэдэн алдаа гарлаа" : "Зөв хариулт:"}</strong>
          {!verdict.right && current.kind !== "match" ? <span lang={current.kind === "meaning" ? undefined : lang}>{rightAnswer(current)}</span> : null}
          {item && current.kind !== "tone" ? <small><span lang={lang}>{item.term}</span>{item.reading ? ` · ${item.reading}` : ""} · {item.meaning}</small> : null}
          {item && current.kind === "tone" ? <small>{item.meaning}</small> : null}
        </> : current.kind === "match" ? <small>Зүүн талаас нэгийг, дараа нь хосыг нь сонго.</small> : null}
      </div>
      {verdict ? <button type="button" className={styles.primary} onClick={next} autoFocus>Үргэлжлүүлэх</button> : current.kind === "match" ? null : <>
        <button type="button" className={styles.secondary} onClick={skip}>Алгасах</button>
        <button type="button" className={styles.primary} disabled={!canCheck} onClick={check}>Шалгах</button>
      </>}
    </footer>
  </div>;
}
