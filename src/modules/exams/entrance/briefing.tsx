import Link from "next/link";
import type { ExamDefinition } from "../types";
import { entranceSubjectHrefs, entranceSubjectLabels, findEntranceMeta } from "./catalog";
import { EntranceStart } from "./start-client";
import { findFreeMock } from "../free/catalog";
import "./entrance.css";

const structure: Record<string, string> = {
  math: "36 сонгох + 4 бодолт",
  physics: "46 сонгох + 4 бодолт",
  chemistry: "40 сонгох + 4 бүтээх даалгавар",
  biology: "A–E сонгох + 4 бүтээх даалгавар",
  english: "Part I + Part II",
};

/** `practice`: practice mode opens (the API's rule); `free`: a free half-length paper for every signed-in account. */
export function EntranceBriefing({ exam, hasAccess, practice, free, loggedIn, activeAttemptId }: { exam: ExamDefinition; hasAccess: boolean; practice: boolean; free: boolean; loggedIn: boolean; activeAttemptId?: string }) {
  const sample = findFreeMock(exam.slug);
  // A free paper is not one of a year's forms, so it reads as "Үнэгүй туршилт" instead of a year and form.
  const meta = findEntranceMeta(exam.slug) ?? (sample ? { year: "Үнэгүй", form: "хагас хэмжээ", durationMinutes: sample.minutes, points: sample.points } : undefined);
  if (!meta || !exam.subject) return null;
  const stage = exam.stages[0];
  const choice = stage.questions.filter(question => question.kind === "choice").length;
  const typed = stage.questions.length - choice;
  const tasks = stage.groups?.filter(group => group.pageMode === "group").length ?? 0;
  return <div className="container page-space eesh-briefing">
    <nav className="eesh-breadcrumb" aria-label="Шалгалтын зам">
      <Link className="text-link" href="/exams">← Бүх шалгалт</Link>
      <span aria-hidden="true">/</span>
      <Link className="text-link" href={entranceSubjectHrefs[exam.subject]}>{entranceSubjectLabels[exam.subject]}</Link>
      <span aria-hidden="true">/</span>
      <span>{meta.year} · {meta.form}</span>
    </nav>

    <div className="eesh-brief-layout">
      <section className="eesh-brief-main">
        <p className="eyebrow">ЭЕШ · {entranceSubjectLabels[exam.subject].toUpperCase()} · {meta.year}</p>
        <h1>{meta.year} · {meta.form}</h1>
        <p className="eesh-brief-lede">{exam.description}</p>
        <ul className="eesh-chips" aria-label="Шалгалтын товч">
          <li>{stage.questions.length} даалгавар</li>
          <li>{typed ? `${choice} сонгох + ${typed} бичих` : `${choice} хариулт`}</li>
          <li>{meta.durationMinutes} минут</li>
          <li>{meta.points} оноо</li>
        </ul>
        {tasks ? <p className="eesh-brief-structure">{structure[exam.subject] ?? ""}{typed ? ` · ${typed} дэд асуулт` : ""}</p> : null}
        <div className="eesh-brief-actions">
          <EntranceStart slug={exam.slug} hasAccess={hasAccess} loggedIn={loggedIn} activeAttemptId={activeAttemptId} free={free} />
          {practice ? <Link className="eesh-practice-link" href={"/exams/" + exam.slug + "/practice"}>
            <strong>Цаггүй дадлага</strong>
            <span>Хариу бүрийг шууд шалгаж, тайлбар уншина · AI туслахтай</span>
            <span aria-hidden="true">→</span>
          </Link> : null}
        </div>
      </section>

      <aside className="eesh-brief-rail" aria-label="Шалгалтын товч мэдээлэл">
        <div className="eesh-rail-head">
          <span className="eyebrow">ШАЛГАЛТЫН ТОВЧ</span>
          <span className={hasAccess ? "status access-unlocked" : "status"}>{hasAccess ? "✓ Эрх нээлттэй" : "Эрх шаардлагатай"}</span>
        </div>
        <dl className="eesh-facts">
          <div><dt>Хөтөлбөр</dt><dd>{entranceSubjectLabels[exam.subject]}</dd></div>
          <div><dt>Он · хувилбар</dt><dd>{meta.year} · {meta.form}</dd></div>
          <div><dt>Даалгавар</dt><dd>{stage.questions.length}</dd></div>
          <div><dt>Хугацаа</dt><dd>{meta.durationMinutes} минут</dd></div>
          <div><dt>Оноо</dt><dd>{meta.points}</dd></div>
          <div><dt>Тооцоолуур</dt><dd>{exam.subject === "english" ? "Шаардлагагүй" : "Хэрэглэхгүй"}</dd></div>
        </dl>
        <p className="eesh-rail-price">{free ? "Үнэгүй · бүртгэлтэй бүх хүнд" : "₮10,000 эсвэл ЭЕШ багц"}</p>
        {exam.notes?.length ? <details className="eesh-instructions"><summary>Заавар</summary><ul>{exam.notes.map(note => <li key={note}>{note}</li>)}</ul></details> : null}
        <p className="eesh-rail-note">Зөв хариултын оноо; албан ЭЕШ-ийн оноо биш.</p>
      </aside>
    </div>

    <p className="fine-print eesh-brief-source">Энэ mock нь албан ёсны шалгалт эсвэл баталгаажсан оноо биш. {exam.sourceNote}</p>
  </div>;
}
