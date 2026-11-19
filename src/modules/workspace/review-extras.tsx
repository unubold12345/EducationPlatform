"use client";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import type { PublicExamAttempt } from "@/modules/exams/types";
import { MockGrades } from "@/modules/exams/ai-grading/panel";
import { ChineseText, HskImage, HskMaterial, HskQuestion, hskOptionLabels, hskPart, transcriptLines } from "@/modules/exams/hsk/view";
import { hskLevel } from "@/modules/exams/hsk/catalog";
import { KoreanText, topikChars } from "@/modules/exams/topik/text";
import { CIRCLED, TopikGroupHead, TopikQuestion, TopikWriting, gapValues } from "@/modules/exams/topik/view";
import { TOPIK_LEVELS, topikGrade, topikLevel, topikName } from "@/modules/exams/topik/catalog";
import "@/modules/exams/hsk/hsk.css";
import "@/modules/exams/topik/topik.css";
import "@/modules/exams/toefl/toefl.css";

// The Speaking Lab's report card loads only when the AI examiner is enabled for IELTS.
const MockSpeakingReport = dynamic(() => import("@/modules/exams/speaking-examiner-view").then(module => module.MockSpeakingReport), { ssr: false });

/**
 * Each programme's own result details inside the Review page (2026-11-19, replacing the separate result pages):
 * HSK's practice score (100 per section), TOPIK's level with the Writing self-check, IELTS/TOEFL AI grades and recordings, and the
 * SAT/ЭЕШ notes. TOPIK Writing self-scores stay in this page only and are never saved or sent, as before.
 */
type Review = NonNullable<PublicExamAttempt["report"]>["reviews"][number];
export type SelfScores = Record<string, number>;

const hskPerItem = (total: number) => total > 0 ? 100 / total : 0;
const hskPracticeScore = (correct: number, total: number) => Math.round(correct * hskPerItem(total));
// 60% of the practice maximum: the 120/200 that HSK 1–2 used; HSK 3.0 thresholds are not published yet.
const HSK_PRACTICE_PASS_SHARE = 0.6;
const WRITING_MAX: Record<string, number> = { "51": 10, "52": 10, "53": 30, "54": 50 };
export const isTopikWriting = (review: Review) => review.groupId?.startsWith("topik-w-") ?? false;
const speakingStages = ["toefl-s-repeat-1", "toefl-s-repeat-2", "toefl-s-repeat-3", "toefl-s-repeat-4", "toefl-s-repeat-5", "toefl-s-repeat-6", "toefl-s-repeat-7", "toefl-s-interview-1", "toefl-s-interview-2", "toefl-s-interview-3", "toefl-s-interview-4"];

function Panel({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return <section className={"wsp-section wsp-extras " + className} aria-labelledby="extras-heading">
    <div className="wsp-section-head"><h2 id="extras-heading">{title}</h2></div>
    <div className="wsp-extras-card">{children}</div>
  </section>;
}

function Recordings({ attempt, stages, label }: { attempt: PublicExamAttempt; stages?: string[]; label: (stageId: string) => string }) {
  const endpoint = "/api/mock-attempts/" + attempt.id + "/recordings/";
  const list = stages ? stages.flatMap(stageId => attempt.recordings.filter(recording => recording.stageId === stageId)) : attempt.recordings;
  return <section className="wsp-section exam-recordings wsp-recordings" aria-labelledby="recordings-heading">
    <div className="wsp-section-head"><h2 id="recordings-heading">Speaking бичлэгүүд</h2></div>
    {list.length ? <div className="wsp-recording-list">{list.map(recording => <div key={recording.stageId} className="wsp-recording">
      <h3>{label(recording.stageId)}</h3>
      <audio controls preload="none" src={endpoint + recording.stageId} />
      <a className="text-link" download={recording.stageId + (recording.mime.includes("mp4") ? ".m4a" : ".webm")} href={endpoint + recording.stageId}>Татах ↓</a>
    </div>)}</div> : <p className="wsp-muted">Хадгалсан бичлэг одоогоор алга. Илгээж буй бичлэг байвал дуусмагц шинэчилнэ.</p>}
  </section>;
}

/** The panel under the score: whatever this programme's result shows beyond the shared review. */
export function ReviewExtras({ attempt, examiner, self, readings, onReadings }: {
  attempt: PublicExamAttempt; examiner: boolean; self: SelfScores; readings: boolean; onReadings: (value: boolean) => void;
}) {
  const report = attempt.report!;
  if (attempt.program === "hsk") {
    const level = hskLevel(attempt.slug);
    const practice = report.sections.reduce((sum, section) => sum + hskPracticeScore(section.correct, section.total), 0);
    const perItem = [...new Set(report.sections.map(section => hskPerItem(section.total)))].map(value => Number(value.toFixed(2))).join(" / ");
    const max = report.sections.length * 100;
    const pass = Math.round(max * HSK_PRACTICE_PASS_SHARE);
    return <Panel title={`HSK ${level} дадлагын оноо`}>
      <div className="wsp-extras-top">
        <p className="wsp-extras-line hsk-score-line"><strong>{report.points.earned}/{report.points.total}</strong> зөв · Дадлагын оноо <strong>{practice}/{max}</strong></p>
        <button type="button" className="wsp-ghost is-small" aria-pressed={readings} onClick={() => onReadings(!readings)}>Pinyin {readings ? "✓" : "—"}</button>
      </div>
      <div className="wsp-sections">{report.sections.map(section => <div key={section.title} className="wsp-section-score">
        <span>{section.title}</span><strong>{hskPracticeScore(section.correct, section.total)} <small>/ 100</small></strong><small>{section.correct} / {section.total} зөв</small>
      </div>)}</div>
      <p className="wsp-extras-note hsk-note">Дадлагын оноо = зөв хариулт × {perItem} (хэсэг бүр 100). Хуучин HSK {level}-ийн тэнцэх босго 60% ({pass}/{max}) байсан; HSK 3.0-ийн босго хараахан нийтлэгдээгүй. Энэ нь албан, тэнцүүлсэн оноо биш; түвшин батлахгүй. {practice >= pass ? "Энэ mock-д " + pass + "-аас дээш авлаа." : pass + " хүртэл " + (pass - practice) + " оноо дутуу."} Эх зохиомжтой, багшийн хяналт хүлээгдэж буй дадлага.</p>
    </Panel>;
  }
  if (attempt.program === "topik") {
    const level = topikLevel(attempt.slug);
    const writing = report.reviews.filter(isTopikWriting);
    const writingScore = writing.reduce((sum, review) => sum + (self[review.number ?? ""] ?? 0), 0);
    const scored = report.points.earned + (level === 2 ? writingScore : 0);
    const total = level === 2 ? 300 : 200;
    const grade = topikGrade(level, scored);
    const next = TOPIK_LEVELS[level].find(step => scored < step.min);
    return <Panel title={`${topikName(level)} түвшин`}>
      <p className="wsp-extras-line topik-score-line"><strong>{scored}/{total}</strong> оноо{level === 2 ? <> (сонсох, унших {report.points.earned}/200{writing.length ? <> + бичих {writingScore}/100 өөрийн үнэлгээ</> : null})</> : null} · {grade ? <>Дадлагын түвшин <strong>{grade}-р түвшин ({grade}급)</strong></> : <>Түвшин хүрээгүй</>}</p>
      <p className="wsp-extras-note topik-note">{topikName(level)}-ийн албан босго: {TOPIK_LEVELS[level].map(step => `${step.level}-р түвшин ${step.min}`).join(", ")} ({total}-аас). {next ? `${next.level}-р түвшин хүртэл ${next.min - scored} оноо дутуу.` : "Хамгийн дээд түвшний босгыг давлаа."} Энэ нь эх зохиомжтой mock-ийн дадлагын тооцоо; албан TOPIK оноо, түвшин биш.{level === 2 && writing.length ? " Бичих хэсгийн оноог доорх «Бичих» шүүлтэд жишиг хариу, шалгуураар өөрөө тавина; хадгалагдахгүй." : ""}</p>
    </Panel>;
  }
  if (attempt.program === "toefl") {
    const reading = report.sections.find(item => item.title === "Reading"), listening = report.sections.find(item => item.title === "Listening");
    const build = report.reviews.filter(review => review.domain === "Writing" && review.correct !== null);
    const readingUpper = report.reviews.some(review => review.id.includes("-r2u-")), listeningUpper = report.reviews.some(review => review.id.includes("-l2u-"));
    return <>
      <Panel title="TOEFL модуль ба AI үнэлгээ">
        <div className="wsp-sections">
          <div className="wsp-section-score"><span>Reading</span><strong>{reading?.correct ?? 0} <small>/ {reading?.total ?? 50}</small></strong><small>Module 2: {readingUpper ? "Upper" : "Lower"}</small></div>
          <div className="wsp-section-score"><span>Listening</span><strong>{listening?.correct ?? 0} <small>/ {listening?.total ?? 47}</small></strong><small>Module 2: {listeningUpper ? "Upper" : "Lower"}</small></div>
          <div className="wsp-section-score"><span>Build a Sentence</span><strong>{build.filter(review => review.correct).length} <small>/ {build.length}</small></strong><small>Writing · зөв өгүүлбэр</small></div>
        </div>
        <MockGrades attempt={attempt} />
        <p className="wsp-extras-note toefl-note">Зөв хариултын тоо (raw). ETS-ийн 1–6 band болон 0–120 оноонд хөрвүүлэхгүй: ETS албан хөрвүүлэлтийн хүснэгт нийтэлдэггүй. {(!readingUpper || !listeningUpper) ? "Lower модуль нь ойролцоогоор B1 ба түүнээс доош түвшний дадлага. " : ""}Энэ бол ETS-ийн материал биш; TOEFL, TOEFL iBT нь ETS-ийн бүртгэлтэй тэмдэг.</p>
      </Panel>
      <Recordings attempt={attempt} stages={speakingStages} label={stageId => stageId.includes("repeat") ? "Listen and Repeat " + stageId.split("-").pop() : "Interview " + stageId.split("-").pop()} />
    </>;
  }
  if (attempt.program === "ielts") return <>
    <section className="wsp-section wsp-extras" aria-label="IELTS AI үнэлгээ"><div className="wsp-extras-card"><MockGrades attempt={attempt} /></div></section>
    <Recordings attempt={attempt} label={stageId => stageId.replace("ielts-", "")} />
    {examiner ? <section className="wsp-section wsp-extras" aria-label="Speaking Lab тайлан"><MockSpeakingReport attemptId={attempt.id} reviews={report.reviews} /></section> : null}
  </>;
  if (attempt.program === "sat") return <p className="wsp-extras-note wsp-section">{attempt.timeline.length <= 2
    ? `Үнэгүй хагас mock: хэсэг бүрийн нэг модуль, дасан зохицох чиглүүлэлтгүй. Доор бүх ${report.reviews.length} асуултын тайлбар бий. Үүнийг 400–1600 албан ёсны SAT оноонд хөрвүүлэхгүй.`
    : `SAT-ийн хоёрдугаар модуль нь 65%-ийн дадлагын босгоор сонгогдсон. Модуль бүрийн хоёр туршилтын асуултыг үндсэн raw тоонд оруулаагүй. Доор бүх ${report.reviews.length} асуултын тайлбар бий. Үүнийг 400–1600 албан ёсны SAT оноонд хөрвүүлэхгүй.`}</p>;
  return null;
}

/**
 * HSK and TOPIK questions keep their own printed layout (pictures, dialogue groups, ①–④, Writing grids) in the review.
 * Returns null for the shared layout. `hideExplanation`: the TOPIK Writing block already shows the rubric.
 */
export function programQuestion(attempt: PublicExamAttempt, review: Review, state: { self: SelfScores; onSelf: (number: string, value: number) => void; readings: boolean }): { body: ReactNode; transcript?: ReactNode; hideExplanation?: boolean } | null {
  if (attempt.program === "hsk") {
    const part = hskPart(review.groupId, review.hskGroup);
    const transcript = review.transcript ? <details className="wsp-material" open><summary>Бичлэгийн текст</summary><div className="hsk-transcript" lang="zh-CN">{transcriptLines(review.transcript).map((line, i) => <p key={i}><ChineseText line={line} readings={state.readings} /></p>)}</div></details> : undefined;
    if (!part) return review.figure?.kind === "image" ? { body: <><HskImage picture={review.figure} /><Answers review={review} /></>, transcript } : null;
    return { body: <div className="hsk-review wsp-program-question">
      <HskMaterial group={review.hskGroup} readings={state.readings} example={false} />
      <HskQuestion question={{ id: "review-" + review.id, number: review.number, options: hskOptionLabels(part, review.hsk, review.hskGroup), figure: review.figure, hsk: review.hsk }} part={part} value={review.selected} disabled readings={state.readings} correct={review.answer.split(" ")[0]} onChange={() => {}} />
      <Answers review={review} />
    </div>, transcript };
  }
  if (attempt.program === "topik") {
    const head = review.topikGroup ? <TopikGroupHead group={review.topikGroup} example={false} /> : null;
    if (isTopikWriting(review)) {
      const number = review.number ?? "";
      return { body: <div className="topik-review wsp-program-question">{head}<WritingReview review={review} score={state.self[number] ?? 0} onScore={value => state.onSelf(number, value)} /></div>, hideExplanation: true };
    }
    const transcript = review.transcript ? <details className="wsp-material" open><summary>Бичлэгийн текст</summary><div className="topik-transcript" lang="ko">{review.transcript.split("\n").map((line, i) => <p key={i}>{line}</p>)}</div></details> : undefined;
    return { body: <div className="topik-review wsp-program-question">{head}
      <TopikQuestion question={{ id: "review-" + review.id, number: review.number, options: [...CIRCLED], topik: review.topik }} value={review.selected} disabled correct={review.answer.split(" ")[0]} onChange={() => {}} />
      <Answers review={review} lang="ko" />
    </div>, transcript };
  }
  return null;
}

function Answers({ review, lang }: { review: Review; lang?: string }) {
  return <dl className="wsp-answers">
    <div><dt>Таны хариу</dt><dd lang={lang}>{review.selected.trim() || <span className="wsp-muted">Хариулаагүй</span>}</dd></div>
    {review.answer ? <div><dt>Зөв хариу</dt><dd lang={lang}>{review.answer}</dd></div> : null}
  </dl>;
}

function WritingReview({ review, score, onScore }: { review: Review; score: number; onScore: (value: number) => void }) {
  const max = WRITING_MAX[review.number ?? ""] ?? 0;
  const gaps = review.topik?.gaps;
  return <div className="topik-writing-review">
    <TopikWriting question={{ id: "review-" + review.id, number: review.number, topik: review.topik }} value={review.selected} disabled onChange={() => {}} />
    {gaps ? <p className="sr-only">{gaps.map(gap => `${gap}: ${gapValues(review.selected, gaps)[gap] || "—"}`).join("; ")}</p> : review.selected.trim() ? null : <p>Хариу бичээгүй.</p>}
    <section className="topik-model"><h3>Жишиг хариу</h3><div lang="ko">{review.answer.split("\n").map((line, i) => <p key={i}><KoreanText text={line} inline /></p>)}</div>{gaps ? null : <p className="topik-count">Жишиг: {topikChars(review.answer)} тэмдэгт</p>}</section>
    <section className="topik-rubric"><h3>Үнэлгээний шалгуур</h3><p>{review.explanation}</p></section>
    <label className="topik-self">Өөрийн оноо: <input type="range" min={0} max={max} step={1} value={score} onChange={event => onScore(Number(event.target.value))} /><strong>{score}/{max}</strong></label>
  </div>;
}

/** The TOPIK Writing self-score shown on a question's points line. */
export function selfPoints(attempt: PublicExamAttempt, review: Review, self: SelfScores) {
  if (attempt.program !== "topik" || !isTopikWriting(review)) return null;
  const number = review.number ?? "";
  return `${self[number] ?? 0} / ${WRITING_MAX[number] ?? 0} өөрийн`;
}
