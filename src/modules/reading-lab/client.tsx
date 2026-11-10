"use client";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import { Icon } from "@/modules/workspace/icons";
import { CreditCost, useCredits } from "@/modules/credits/client";
import { readReceipt, readingPracticeHold } from "@/modules/credits/pricing";
import { MaterialImages, useMaterialPick } from "@/modules/ai-images/client";
import {
  GAP, READING_LIMITS, TFNG, allQuestions, gradeReading, groupType, isReadingLanguage, matchCount, matchLabel, optionLetter, paragraphLabel,
  passageWords, publicGroups, type PublicGroup, type PublicQuestion, type ReadingAnswer, type ReadingAnswers, type ReadingGrade,
  type ReadingLanguage, type ResultItem,
} from "./contracts";
import { readingSamples, type ReadingSample } from "./samples";
import {
  blankState, deleteOwn, newPracticeId, readState, saveOwn, setOwnState, setSampleState, updateLab, useReadingLab, validPublicGroups,
  type OwnPractice, type PracticeState, type TextSize,
} from "./store";
import styles from "./reading.module.css";

const ACCEPT = ".pdf,.docx,.pptx,.txt,.md,.csv,image/*";
const ALLOWED = new Set(["pdf", "docx", "pptx", "txt", "md", "csv"]);
const SECONDS = READING_LIMITS.minutes * 60;
const dateLabel = new Intl.DateTimeFormat("mn-MN", { timeZone: "Asia/Ulaanbaatar", month: "short", day: "numeric" });
const bytes = (size: number) => size >= 1024 * 1024 ? (size / 1024 / 1024).toFixed(1) + " MB" : Math.max(1, Math.round(size / 1024)) + " KB";
const clock = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  return String(Math.floor(safe / 60)).padStart(2, "0") + ":" + String(safe % 60).padStart(2, "0");
};
const filled = (value: ReadingAnswer | undefined) => typeof value === "number" || (typeof value === "string" && value.trim() !== "");
const range = (first: number, last: number) => first === last ? `Question ${first}` : `Questions ${first}–${last}`;
const typesOf = (groups: readonly PublicGroup[]) => [...new Set(groups.map(group => groupType(group)).filter(Boolean))];

/** One practice as the runner sees it: a passage, answer-free questions and how to mark them. */
type RunnerPractice = {
  title: string;
  paragraphs: string[];
  groups: PublicGroup[];
  meta: string[];
  check: (answers: ReadingAnswers) => Promise<ReadingGrade>;
};
type View = { kind: "library" } | { kind: "sample"; id: string } | { kind: "own"; id: string };

// Samples carry their key in the page bundle; the runner only ever gets the answer-free groups.
const SAMPLE_GROUPS = new Map(readingSamples.map(sample => [sample.id, publicGroups(sample.groups)]));
function samplePractice(sample: ReadingSample): RunnerPractice {
  return {
    title: sample.title, paragraphs: sample.paragraphs, groups: SAMPLE_GROUPS.get(sample.id) ?? [],
    meta: [sample.topic, sample.level, `${passageWords(sample.paragraphs)} үг`],
    check: async answers => gradeReading(sample.groups, answers),
  };
}
function ownPractice(own: OwnPractice): RunnerPractice {
  return {
    title: own.title, paragraphs: own.paragraphs, groups: own.groups,
    meta: ["Миний дасгал", `${passageWords(own.paragraphs)} үг`, own.sourceName],
    check: async answers => {
      const response = await fetch("/api/labs/ielts-reading/grade", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: own.token, answers }), signal: AbortSignal.timeout(30_000),
      });
      const data = await jsonObject(response);
      if (response.status === 401) throw new Error("Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.");
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Хариулт шалгаж чадсангүй. Дахин оролдоно уу.");
      const grade = readState({ result: data }).result;
      if (!grade) throw new Error("Дүн бүрэн ирсэнгүй. Дахин оролдоно уу.");
      return grade;
    },
  };
}

export function ReadingLab({ userKey }: { userKey: string | null }) {
  const lab = useReadingLab(userKey);
  const [view, setView] = useState<View>({ kind: "library" });
  // What the last generation actually cost, shown once on the practice it made.
  const [notice, setNotice] = useState<{ id: string; text: string } | null>(null);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [view]);
  const back = () => { setNotice(null); setView({ kind: "library" }); };
  const setTextSize = (size: TextSize) => updateLab(userKey, current => ({ ...current, textSize: size }));

  if (view.kind === "sample") {
    const sample = readingSamples.find(item => item.id === view.id);
    if (sample) return <Runner key={"sample:" + sample.id} practice={samplePractice(sample)} state={lab.samples[sample.id] ?? blankState()}
      onState={state => setSampleState(userKey, sample.id, state)} textSize={lab.textSize} onTextSize={setTextSize} onBack={back} />;
  }
  if (view.kind === "own") {
    const own = lab.own.find(item => item.id === view.id);
    if (own) return <Runner key={"own:" + own.id} practice={ownPractice(own)} state={own.state} notice={notice?.id === own.id ? notice.text : null}
      onState={state => setOwnState(userKey, own.id, state)} textSize={lab.textSize} onTextSize={setTextSize} onBack={back} />;
  }

  return <div className={`wsp-page ${styles.page}`}>
    <header className={styles.head}>
      <p className={styles.kicker}><Link href="/workspace/workshop">Workshop</Link><span aria-hidden="true">·</span>Reading</p>
      <h1>Унших лаб</h1>
      <p className={styles.lead}>IELTS Academic Reading-ийн маягаар эх бичвэр уншиж, асуултад хариулна. Хариултаа шалгахад зөв хариултын нотолгоог текстээс тэмдэглэж, яагаад зөв болохыг тайлбарлана.</p>
      <ul className={styles.facts} aria-label="Дасгалын бүтэц">
        <li><Icon name="clock" size={16} />{READING_LIMITS.minutes} минут нэг текстэд</li>
        <li><Icon name="check" size={16} />12–13 асуулт, 7 төрөл</li>
        <li><Icon name="search" size={16} />Нотолгоог текстээс тэмдэглэнэ</li>
      </ul>
    </header>

    <section className={styles.section} aria-labelledby="rl-samples">
      <div className={styles.sectionHead}><h2 id="rl-samples">Жишээ дасгалууд</h2><span>Үнэгүй · амар хэцүүгийн дарааллаар</span></div>
      <div className={styles.samples}>
        {readingSamples.map((sample, index) => {
          const state = lab.samples[sample.id];
          const total = allQuestions(sample.groups).length;
          const started = state && Object.values(state.answers).some(filled);
          return <button key={sample.id} type="button" className={styles.sample} onClick={() => setView({ kind: "sample", id: sample.id })} data-sample={sample.id}>
            <span className={styles.sampleTop}><span className={styles.sampleNum}>{String(index + 1).padStart(2, "0")}</span><span className={styles.level}>{sample.level}</span></span>
            <strong lang="en">{sample.title}</strong>
            <span className={styles.topic}>{sample.topic}</span>
            <span className={styles.summary}>{sample.summary}</span>
            <span className={styles.types} lang="en">{typesOf(sample.groups).join(" · ")}</span>
            <span className={styles.sampleFoot}>
              <span>{passageWords(sample.paragraphs)} үг · {total} асуулт</span>
              {state?.best != null ? <em data-full={state.best === total ? "" : undefined}>{state.best}/{total}</em>
                : started ? <em>Үргэлжилж байна</em> : <span className={styles.go}>Эхлэх<Icon name="arrow" size={15} /></span>}
            </span>
          </button>;
        })}
      </div>
    </section>

    <section className={styles.section} aria-labelledby="rl-create">
      <div className={styles.sectionHead}><h2 id="rl-create">Өөрийн дасгал үүсгэх</h2><span>Файл, зураг эсвэл текстээс</span></div>
      {userKey ? <Creator userKey={userKey} onCreated={(id, text) => { setNotice({ id, text }); setView({ kind: "own", id }); }} />
        : <div className={styles.signin}>
          <span className={styles.signinMark} aria-hidden="true"><Icon name="spark" size={22} /></span>
          <div><strong>Өөрийн нийтлэл, хичээлээс IELTS дасгал</strong><p>Нэвтэрч ороод файл, хуудасны зураг эсвэл текстээ оруулбал AI түүнээс IELTS маягийн эх бичвэр, асуулт бэлдэнэ.</p></div>
          <Link className={styles.primary} href="/login?next=%2Flabs%2Fielts-reading">Нэвтрэх</Link>
        </div>}
    </section>

    {userKey && lab.own.length ? <section className={styles.section} aria-labelledby="rl-own">
      <div className={styles.sectionHead}><h2 id="rl-own">Миний дасгалууд</h2><span>{lab.own.length} дасгал · энэ хөтөчид</span></div>
      <div className={styles.ownList}>{lab.own.map(own => {
        const total = allQuestions(own.groups).length;
        return <article key={own.id} className={styles.own}>
          <button type="button" className={styles.ownOpen} onClick={() => setView({ kind: "own", id: own.id })}>
            <span className={styles.ownMark} aria-hidden="true"><Icon name="book" size={20} /></span>
            <span className={styles.ownText}>
              <strong lang="en">{own.title}</strong>
              <small>{total} асуулт · {passageWords(own.paragraphs)} үг · {dateLabel.format(new Date(own.createdAt))}</small>
              <small className={styles.ownSource}>{own.sourceName}</small>
            </span>
            {own.state.best != null ? <span className={styles.ownScore}><strong>{own.state.best}/{total}</strong><small>шилдэг</small></span>
              : <span className={styles.badge}>{Object.values(own.state.answers).some(filled) ? "Үргэлжилж байна" : "Шинэ"}</span>}
            <Icon name="arrow" size={18} className={styles.ownArrow} />
          </button>
          <button type="button" className={styles.ownDelete} title="Устгах" aria-label={`${own.title} дасгалыг устгах`} onClick={() => {
            if (window.confirm(`"${own.title}" дасгалыг устгах уу? Хариулт, дүн хамт устана.`)) deleteOwn(userKey, own.id);
          }}><Icon name="trash" size={17} /></button>
        </article>;
      })}</div>
    </section> : null}
  </div>;
}

function Creator({ userKey, onCreated }: { userKey: string; onCreated: (id: string, notice: string) => void }) {
  const [mode, setMode] = useState<"file" | "text">("file");
  const material = useMaterialPick({ extensions: ALLOWED, maxBytes: READING_LIMITS.fileBytes, documentHint: "PDF, Word, PowerPoint, TXT, MD, CSV файл эсвэл хуудасны зураг сонгоно уу." });
  const picked = material.pick;
  const file = picked?.kind === "document" ? picked.file : null;
  const [text, setText] = useState("");
  const [language, setLanguage] = useState<ReadingLanguage>("mn");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const { apply } = useCredits();
  const input = useRef<HTMLInputElement>(null);
  const length = text.trim().length;
  const ready = mode === "file" ? Boolean(picked) && !material.preparing : length >= READING_LIMITS.minSourceChars;
  // The most this material can cost, as the server holds it; the charge settles lower for shorter material.
  const hold = mode === "text" ? readingPracticeHold(Math.max(length, READING_LIMITS.minSourceChars))
    : picked?.kind === "images" ? readingPracticeHold(0, picked.images.length) : readingPracticeHold(READING_LIMITS.textChars);

  async function pick(next: ArrayLike<File> | null | undefined) {
    setError("");
    setError(await material.choose(next));
  }
  function drop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (!pending) void pick(event.dataTransfer.files);
  }
  async function generate() {
    if (!ready || pending) return;
    setPending(true); setError("");
    try {
      const form = new FormData();
      if (mode === "file") material.append(form); else form.append("text", text.trim());
      form.append("language", language);
      const response = await fetch("/api/labs/ielts-reading", { method: "POST", body: form, signal: AbortSignal.timeout(175_000) });
      const data = await jsonObject(response);
      if (response.status === 401) throw new Error("Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.");
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Дасгал үүсгэж чадсангүй. Дахин оролдоно уу.");
      apply(data);
      const practice = createdPractice(data);
      if (!practice) throw new Error("AI дасгал бүрэн ирсэнгүй. Дахин оролдоно уу.");
      saveOwn(userKey, practice);
      material.clear(); setText("");
      const receipt = readReceipt(data);
      onCreated(practice.id, receipt ? `Дасгал бэлэн боллоо. ${receipt.spent} кредит зарцууллаа${receipt.spent < hold ? ` (хамгийн ихдээ ${hold} кредит барьж, үлдсэнийг буцаалаа)` : ""}.` : "Дасгал бэлэн боллоо.");
    } catch (reason) {
      setError(reason instanceof Error && reason.name !== "TimeoutError" ? reason.message : "Дасгал үүсгэхэд хэт удлаа. Дахин оролдоно уу.");
    } finally { setPending(false); }
  }

  return <div className={styles.create}>
    <div className={styles.source}>
      <div className={styles.segmented} role="tablist" aria-label="Материалын төрөл">
        <button type="button" role="tab" aria-selected={mode === "file"} onClick={() => { setMode("file"); setError(""); }} disabled={pending}><Icon name="fileExam" size={16} />Файл, зураг</button>
        <button type="button" role="tab" aria-selected={mode === "text"} onClick={() => { setMode("text"); setError(""); }} disabled={pending}><Icon name="pen" size={16} />Текст буулгах</button>
      </div>
      {mode === "file" ? <div className={`${styles.drop} ${dragging ? styles.dropActive : ""}`}
        onDragEnter={event => { event.preventDefault(); if (!pending) setDragging(true); }}
        onDragOver={event => event.preventDefault()}
        onDragLeave={event => { if (event.currentTarget === event.target) setDragging(false); }}
        onDrop={drop}>
        <input ref={input} type="file" accept={ACCEPT} multiple className="sr-only" disabled={pending} aria-label="Унших дасгал үүсгэх файл эсвэл зураг сонгох"
          onChange={event => { const files = Array.from(event.target.files ?? []); event.target.value = ""; void pick(files); }} />
        {picked?.kind === "images" || (material.preparing && !file) ? <MaterialImages images={picked?.kind === "images" ? picked.images : []} max={material.max} onRemove={material.removeImage} onAdd={() => input.current?.click()} busy={material.preparing} disabled={pending} />
          : file ? <div className={styles.fileRow}>
            <span className={styles.fileIcon} aria-hidden="true">{file.name.split(".").pop()?.toUpperCase().slice(0, 4)}</span>
            <span className={styles.fileText}><strong>{file.name}</strong><small>{bytes(file.size)}</small></span>
            <button type="button" className={styles.remove} onClick={() => { material.clear(); input.current?.focus(); }} aria-label="Сонгосон файлыг арилгах" disabled={pending}><Icon name="close" size={18} /></button>
          </div> : <>
            <span className={styles.dropIcon} aria-hidden="true"><Icon name="book" size={26} /></span>
            <strong>{dragging ? "Файл эсвэл зургаа тавина уу" : "Нийтлэл, хичээлийн файлаа энд чирэх"}</strong>
            <span>{READING_LIMITS.fileBytes / 1024 / 1024} MB хүртэл · PDF, DOCX, PPTX, TXT, MD эсвэл {material.max} хүртэл хуудасны зураг</span>
            <button type="button" className={styles.choose} onClick={() => input.current?.click()} disabled={pending}>Файл, зураг сонгох</button>
          </>}
      </div> : <div className={styles.paste}>
        <label htmlFor="rl-text" className="sr-only">Унших дасгал үүсгэх текст</label>
        <textarea id="rl-text" value={text} maxLength={READING_LIMITS.textChars} disabled={pending} spellCheck={false}
          placeholder="Англи эсвэл монгол хэл дээрх нийтлэл, хичээлийн бичвэрээ энд буулгана уу…" onChange={event => setText(event.currentTarget.value)} />
        <p className={styles.counter} data-short={length && length < READING_LIMITS.minSourceChars ? "" : undefined}>
          {length.toLocaleString("en-US")} / {READING_LIMITS.textChars.toLocaleString("en-US")} тэмдэгт{length < READING_LIMITS.minSourceChars ? ` · дор хаяж ${READING_LIMITS.minSourceChars.toLocaleString("en-US")}` : ""}
        </p>
      </div>}
    </div>

    <div className={styles.settings}>
      <div className={styles.setting} role="group" aria-label="Тайлбарын хэл">
        <span className={styles.settingLabel}>Тайлбарын хэл</span>
        <div className={styles.toggle}>
          <button type="button" aria-pressed={language === "mn"} onClick={() => setLanguage("mn")} disabled={pending}>Монгол</button>
          <button type="button" aria-pressed={language === "en"} onClick={() => setLanguage("en")} disabled={pending}>English</button>
        </div>
        <small>Эх бичвэр, асуулт англиар; тайлбар энэ хэлээр.</small>
      </div>
      <ul className={styles.will}>
        <li>450–900 үгийн IELTS маягийн эх бичвэр</li>
        <li>12 орчим асуулт: T/F/NG, сонголттой, нөхөх</li>
        <li>Хариулт бүрийн нотолгоо, тайлбар</li>
      </ul>
      <button type="button" className={styles.generate} onClick={() => void generate()} disabled={!ready || pending} aria-busy={pending}>
        {pending ? <><i className={styles.spinner} aria-hidden="true" />Дасгал бэлдэж байна…</> : <><Icon name="spark" size={18} />Дасгал үүсгэх</>}
      </button>
      <p className={styles.cost}><CreditCost action="reading-practice" cost={hold} upTo /></p>
      {pending ? <p className={styles.status} role="status">Материалыг уншиж, эх бичвэр болон асуулт бэлдэж байна. 30–90 секунд орно.</p> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <p className={styles.fine}>Үнэ нь материалын урт, бэлдсэн эх бичвэр, асуултын тоогоор тооцогдоно: богино текст хямд, барьсан кредитийн илүүг буцаана. Материалын текст эсвэл зураг AI руу илгээгдэнэ. Урт материалын эхний 45,000 тэмдэгтийг ашиглана. Файл, текст серверт хадгалагдахгүй; дасгал, хариулт зөвхөн энэ хөтөчид үлдэнэ, хариултын түлхүүр шалгах хүртэл шифрлэгдэнэ. AI-ийн бэлдсэн дасгал багшийн хяналтгүй. Хугацаатай шалгалтын үеэр хаалттай.</p>
    </div>
  </div>;
}

/** Accept only a complete reply from the generator; anything malformed is treated as a failed generation. */
function createdPractice(data: Record<string, unknown>): OwnPractice | null {
  const { title, paragraphs, groups, token, language, source } = data;
  if (typeof title !== "string" || !title || title.length > 200) return null;
  if (!Array.isArray(paragraphs) || !paragraphs.length || paragraphs.length > READING_LIMITS.paragraphs.max || !paragraphs.every(item => typeof item === "string" && item.length > 0 && item.length <= READING_LIMITS.paragraph + 10)) return null;
  if (!validPublicGroups(groups) || typeof token !== "string" || token.length < 40 || token.length > READING_LIMITS.tokenChars || !isReadingLanguage(language)) return null;
  const info = source && typeof source === "object" ? source as Record<string, unknown> : {};
  const now = Date.now();
  return {
    id: newPracticeId(), title, paragraphs: paragraphs as string[], groups, token, language,
    sourceName: typeof info.name === "string" && info.name ? info.name.slice(0, 200) : "Материал",
    sourceKind: typeof info.kind === "string" && info.kind ? info.kind.slice(0, 20) : "text",
    createdAt: now, updatedAt: now, state: blankState(),
  };
}

type Mark = { start: number; end: number; ids: string[]; labels: number[] };
/** Where each checked answer's evidence sits in the passage: the first paragraph that contains it, without overlaps. */
function evidenceMarks(paragraphs: readonly string[], results: readonly ResultItem[], numbers: Map<string, number>) {
  const marks = paragraphs.map(() => [] as Mark[]);
  for (const item of results) {
    if (!item.evidence) continue;
    const index = paragraphs.findIndex(paragraph => paragraph.includes(item.evidence!));
    if (index < 0) continue;
    const start = paragraphs[index].indexOf(item.evidence), end = start + item.evidence.length;
    const same = marks[index].find(mark => mark.start === start && mark.end === end);
    if (same) { same.ids.push(item.id); same.labels.push(numbers.get(item.id) ?? 0); continue; }
    if (marks[index].some(mark => start < mark.end && end > mark.start)) continue;
    marks[index].push({ start, end, ids: [item.id], labels: [numbers.get(item.id) ?? 0] });
  }
  return marks.map(list => list.sort((a, b) => a.start - b.start));
}

function Runner({ practice, state, notice = null, onState, textSize, onTextSize, onBack }: {
  practice: RunnerPractice; state: PracticeState; notice?: string | null; onState: (state: PracticeState) => void;
  textSize: TextSize; onTextSize: (size: TextSize) => void; onBack: () => void;
}) {
  const questions = useMemo(() => allQuestions(practice.groups), [practice.groups]);
  const numbers = useMemo(() => new Map(questions.map((question, index) => [question.id, index + 1])), [questions]);
  const ranges = useMemo(() => practice.groups.reduce<{ from: number; to: number }[]>((list, group) => {
    const from = (list.at(-1)?.to ?? 0) + 1;
    return [...list, { from, to: from + group.questions.length - 1 }];
  }, []), [practice.groups]);
  const result = state.result;
  const checked = result !== null;
  const results = useMemo(() => new Map(result?.results.map(item => [item.id, item]) ?? []), [result]);
  const marks = useMemo(() => result ? evidenceMarks(practice.paragraphs, result.results, numbers) : null, [practice.paragraphs, result, numbers]);
  const answered = questions.filter(question => filled(state.answers[question.id])).length;
  const [pane, setPane] = useState<"passage" | "questions">("passage");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [focus, setFocus] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const passage = useRef<HTMLElement>(null);
  const timing = state.timerStartedAt !== null && !checked;
  const left = timing ? SECONDS - Math.max(0, Math.round((now - state.timerStartedAt!) / 1000)) : SECONDS;
  const locked = checked || busy;

  useEffect(() => {
    if (!timing) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [timing]);
  useEffect(() => {
    if (!focus) return;
    const frame = requestAnimationFrame(() => passage.current?.querySelector(`[data-q~="${focus}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" }));
    const clear = window.setTimeout(() => setFocus(null), 2600);
    return () => { cancelAnimationFrame(frame); window.clearTimeout(clear); };
  }, [focus]);

  const answer = (id: string, value: ReadingAnswer | null) => {
    if (locked) return;
    const answers = { ...state.answers };
    if (value === null || value === "") delete answers[id]; else answers[id] = value;
    onState({ ...state, answers });
  };
  function startTimer() { setNow(Date.now()); onState({ ...state, timerStartedAt: Date.now() }); }
  function stopTimer() { if (window.confirm("Цагийг зогсоох уу? Хариултууд хэвээр үлдэнэ.")) onState({ ...state, timerStartedAt: null }); }
  async function check() {
    if (locked) return;
    const missing = questions.length - answered;
    if (missing > 0 && !window.confirm(`${missing} асуултад хариулаагүй байна. Хариултаа шалгах уу?`)) return;
    setBusy(true); setError("");
    try {
      const grade = await practice.check(state.answers);
      const elapsed = state.timerStartedAt !== null ? Math.max(0, Math.round((Date.now() - state.timerStartedAt) / 1000)) : null;
      onState({ ...state, result: grade, best: Math.max(state.best ?? 0, grade.correct), attempts: state.attempts + 1, timerStartedAt: null, finishedSeconds: elapsed });
      setPane("questions");
      // The score card sits at the top of the questions; the passage pane keeps its own place.
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (reason) {
      setError(reason instanceof Error && reason.name !== "TimeoutError" ? reason.message : "Хариулт шалгахад хэт удлаа. Дахин оролдоно уу.");
    } finally { setBusy(false); }
  }
  function retry() {
    if (!window.confirm("Хариултууд арилж, дасгал шинээр эхэлнэ. Үргэлжлүүлэх үү?")) return;
    setFocus(null);
    onState({ ...state, answers: {}, result: null, timerStartedAt: null, finishedSeconds: null });
    setPane("passage");
  }
  const show = (id: string) => { setPane("passage"); setFocus(id); };

  return <div className={`wsp-page ${styles.runnerPage}`} data-pane={pane}>
    <header className={styles.bar}>
      <button type="button" className={styles.back} onClick={onBack}><Icon name="back" size={18} /><span>Унших лаб</span></button>
      <div className={styles.barTitle}><strong lang="en">{practice.title}</strong><small>{checked ? `${result.correct}/${result.total} зөв` : `${answered}/${questions.length} хариулсан`}</small></div>
      <div className={styles.barTools}>
        <button type="button" className={styles.tool} onClick={() => onTextSize(((textSize + 1) % 3) as TextSize)} title="Текстийн хэмжээ" aria-label={`Текстийн хэмжээ: ${["жижиг", "дунд", "том"][textSize]}`}><span aria-hidden="true">A<small>A</small></span></button>
        {checked ? state.finishedSeconds !== null ? <span className={styles.timeUsed}><Icon name="clock" size={16} />{clock(state.finishedSeconds)}</span> : null
          : timing ? <button type="button" className={styles.timer} data-over={left < 0 ? "" : undefined} data-low={left >= 0 && left <= 120 ? "" : undefined} onClick={stopTimer} title="Цаг зогсоох">
            <Icon name="clock" size={16} />{left < 0 ? "+" + clock(-left) : clock(left)}
          </button>
          : <button type="button" className={styles.tool} onClick={startTimer} disabled={busy}><Icon name="clock" size={16} /><span>{READING_LIMITS.minutes}:00</span></button>}
        {checked ? <button type="button" className={styles.secondary} onClick={retry}>Дахин оролдох</button>
          : <button type="button" className={styles.primary} onClick={() => void check()} disabled={busy || !answered} aria-busy={busy}>{busy ? "Шалгаж байна…" : "Хариулт шалгах"}</button>}
      </div>
    </header>
    {notice && !checked ? <p className={styles.notice} role="status">{notice}</p> : null}
    {timing && left < 0 ? <p className={styles.overtime} role="status">{READING_LIMITS.minutes} минут дууслаа. Шалгалтад энэ үед дараагийн текст рүү шилжинэ. Хариултаа шалгаарай.</p> : null}
    {error ? <p className={styles.error} role="alert">{error}</p> : null}

    <div className={styles.tabs} role="tablist" aria-label="Харагдац">
      <button type="button" role="tab" aria-selected={pane === "passage"} onClick={() => setPane("passage")}>Текст</button>
      <button type="button" role="tab" aria-selected={pane === "questions"} onClick={() => setPane("questions")}>Асуултууд <small>{checked ? `${result.correct}/${result.total}` : `${answered}/${questions.length}`}</small></button>
    </div>

    <div className={styles.split}>
      <article ref={passage} className={styles.passage} data-size={textSize} lang="en" aria-label="Унших текст">
        <p className={styles.meta} lang="mn">{practice.meta.filter(Boolean).join(" · ")}</p>
        <h2>{practice.title}</h2>
        {practice.paragraphs.map((paragraph, index) => <div key={index} className={styles.paragraph}>
          <span className={styles.letter} aria-label={`Paragraph ${paragraphLabel(index)}`}>{paragraphLabel(index)}</span>
          <p>{marks ? highlight(paragraph, marks[index], focus) : paragraph}</p>
        </div>)}
        {checked ? <p className={styles.markNote} lang="mn">Шараар тэмдэглэсэн хэсэг нь тухайн дугаартай асуултын нотолгоо.</p> : null}
      </article>

      <section className={styles.questions} aria-label="Асуултууд">
        {checked ? <div className={styles.scoreCard} role="status">
          <span className={styles.scoreBig}><strong>{result.correct}</strong>/{result.total}</span>
          <span className={styles.scoreText}><strong>{result.percent}% зөв</strong><small>{state.finishedSeconds !== null ? `${clock(state.finishedSeconds)} зарцуулсан · ` : ""}{state.attempts > 1 && state.best !== null ? `Шилдэг ${state.best}/${result.total}` : "Эхний оролдлого"}</small></span>
          <span className={styles.scoreHint}>Буруу хариулт бүрийн тайлбарыг уншаад «Текстээс харах»-ыг дарж нотолгоог олоорой.</span>
        </div> : null}
        {practice.groups.map((group, groupIndex) => {
          const { from, to } = ranges[groupIndex];
          const choices = group.options && group.labels !== "paragraph" ? group.options : null;
          return <div key={groupIndex} className={styles.group}>
            <div className={styles.groupHead}>
              <h3 lang="en">{range(from, to)}</h3>
              <span className={styles.groupType} lang="en">{groupType(group)}</span>
            </div>
            <p className={styles.instruction} lang="en">{group.instruction}{group.limit ? <> <b>{group.limit}</b></> : null}</p>
            {choices ? <div className={styles.box} lang="en">
              {group.heading ? <p>{group.heading}</p> : null}
              <ol>{choices.map((option, index) => <li key={index}><b>{matchLabel(group, index)}</b><span>{option}</span></li>)}</ol>
            </div> : group.heading ? <p className={styles.boxTitle} lang="en">{group.heading}</p> : null}
            <ol className={styles.list}>{group.questions.map(question => <QuestionItem key={question.id} question={question} number={numbers.get(question.id) ?? 0} group={group}
              paragraphs={practice.paragraphs.length} value={state.answers[question.id]} result={results.get(question.id)} locked={locked}
              onAnswer={value => answer(question.id, value)} onShow={() => show(question.id)} />)}</ol>
          </div>;
        })}
        <div className={styles.footer}>
          {checked ? <button type="button" className={styles.secondary} onClick={retry}>Дахин оролдох</button>
            : <><span>{answered}/{questions.length} хариулсан</span><button type="button" className={styles.primary} onClick={() => void check()} disabled={busy || !answered}>{busy ? "Шалгаж байна…" : "Хариулт шалгах"}</button></>}
          <button type="button" className={styles.linkButton} onClick={onBack}>Бусад дасгал</button>
        </div>
      </section>
    </div>
  </div>;
}

function highlight(paragraph: string, marks: Mark[], focus: string | null): ReactNode {
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const mark of marks) {
    if (mark.start > cursor) parts.push(<Fragment key={"t" + cursor}>{paragraph.slice(cursor, mark.start)}</Fragment>);
    parts.push(<mark key={"m" + mark.start} data-q={mark.ids.join(" ")} data-focus={focus && mark.ids.includes(focus) ? "" : undefined}><sup>{mark.labels.join(",")}</sup>{paragraph.slice(mark.start, mark.end)}</mark>);
    cursor = mark.end;
  }
  if (cursor < paragraph.length) parts.push(<Fragment key={"t" + cursor}>{paragraph.slice(cursor)}</Fragment>);
  return parts;
}

/** The correct answer as the paper prints it, with the option's words where there are any. */
function answerDisplay(group: PublicGroup, question: PublicQuestion, item: ResultItem) {
  if (question.kind === "choice") {
    const index = question.options.findIndex((_, i) => optionLetter(i) === item.answer);
    return index >= 0 ? `${item.answer}. ${question.options[index]}` : item.answer;
  }
  if (question.kind === "match" && group.options && group.labels !== "paragraph") {
    const index = group.options.findIndex((_, i) => matchLabel(group, i) === item.answer);
    return index >= 0 ? `${item.answer}. ${group.options[index]}` : item.answer;
  }
  return item.answer;
}

function QuestionItem({ question, number, group, paragraphs, value, result, locked, onAnswer, onShow }: {
  question: PublicQuestion; number: number; group: PublicGroup; paragraphs: number; value: ReadingAnswer | undefined; result: ResultItem | undefined;
  locked: boolean; onAnswer: (value: ReadingAnswer | null) => void; onShow: () => void;
}) {
  const label = `Question ${number}`;
  const select = () => <select className={styles.select} value={typeof value === "number" ? value : ""} disabled={locked} aria-label={label}
    onChange={event => onAnswer(event.currentTarget.value === "" ? null : Number(event.currentTarget.value))}>
    <option value="">—</option>
    {Array.from({ length: matchCount(group, paragraphs) }, (_, index) => <option key={index} value={index}>
      {matchLabel(group, index)}{group.options && group.labels !== "paragraph" ? `. ${group.options[index]}` : ""}
    </option>)}
  </select>;
  let body: ReactNode;
  if (question.kind === "tfng") {
    body = <fieldset className={styles.tfng}>
      <legend>{question.prompt}</legend>
      <div>{TFNG.map((option, index) => <label key={option} data-chosen={value === index ? "" : undefined} data-correct={result && result.answer === option ? "" : undefined}>
        <input type="radio" name={"rl-" + question.id} checked={value === index} disabled={locked} onChange={() => onAnswer(index)} />{option}
      </label>)}</div>
    </fieldset>;
  } else if (question.kind === "choice") {
    body = <fieldset className={styles.choice}>
      <legend>{question.prompt}</legend>
      {question.options.map((option, index) => <label key={index} data-chosen={value === index ? "" : undefined} data-correct={result && result.answer === optionLetter(index) ? "" : undefined}>
        <input type="radio" name={"rl-" + question.id} checked={value === index} disabled={locked} onChange={() => onAnswer(index)} />
        <span className={styles.optionLetter}>{optionLetter(index)}</span><span>{option}</span>
      </label>)}
    </fieldset>;
  } else if (question.kind === "gap") {
    const [before, after = ""] = question.prompt.split(GAP);
    body = <p className={styles.gap}>{before}<input type="text" value={typeof value === "string" ? value : ""} readOnly={locked} aria-label={label} autoComplete="off" autoCapitalize="off" spellCheck={false}
      maxLength={READING_LIMITS.answerChars} onChange={event => onAnswer(event.currentTarget.value)} />{after}</p>;
  } else if (question.prompt.includes(GAP)) {
    const [before, after = ""] = question.prompt.split(GAP);
    body = <p className={styles.gap}>{before}{select()}{after}</p>;
  } else {
    body = <div className={styles.match}><span>{question.prompt}</span>{select()}</div>;
  }
  return <li className={styles.item} data-result={result ? result.correct ? "good" : "bad" : undefined} lang="en">
    <span className={styles.num}>{number}</span>
    <div className={styles.itemBody}>
      {body}
      {result ? <div className={styles.feedback} lang="mn">
        <p><b>{result.correct ? "Зөв." : "Зөв хариулт:"}</b>{result.correct ? null : <span lang="en"> {answerDisplay(group, question, result)}</span>}</p>
        <p>{result.explanation}</p>
        {result.evidence ? <button type="button" className={styles.linkButton} onClick={onShow}><Icon name="search" size={15} />Текстээс харах</button> : null}
      </div> : null}
    </div>
  </li>;
}

async function jsonObject(response: Response): Promise<Record<string, unknown>> {
  const data: unknown = await response.json().catch(() => ({}));
  return data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : {};
}
