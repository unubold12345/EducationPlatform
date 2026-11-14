import Link from "next/link";
import { ENTRANCE_SUBJECT_ORDER, entranceCounts, entranceSubjectFormats, entranceSubjectHrefs, entranceSubjectLabels, entranceTotal, entranceYears, mocksForYear, type EntranceSubject } from "./catalog";
import { freeMocksOf } from "../free/catalog";
import { FreeMockTile } from "../free/tile";
import "./entrance.css";


export function EntranceHub({ subject }: { subject: EntranceSubject }) {
  const counts = entranceCounts();
  const years = entranceYears(subject);
  const total = counts[subject];
  const firstYear = Math.min(...years), lastYear = Math.max(...years);
  return <div className="container page-space eesh-hub">
    <nav className="eesh-breadcrumb" aria-label="Шалгалтын зам">
      <Link className="text-link" href="/exams">← Бүх шалгалт</Link>
      <span aria-hidden="true">/</span>
      <span>ЭЕШ</span>
    </nav>

    <header className="eesh-hub-head">
      <div>
        <p className="eyebrow">ЭЛСЭЛТИЙН ЕРӨНХИЙ ШАЛГАЛТ · {firstYear}–{lastYear}</p>
        <h1>ЭЕШ-ийн бүтэн mock</h1>
        <p>{entranceSubjectLabels[subject]}: жил, хувилбараар эрэмбэлсэн {total} бүтэн дадлагын шалгалт. Хугацаатай эсвэл цаггүй дадлагаар бэлдээрэй.</p>
      </div>
      <dl className="eesh-hub-facts">
        <div><dt>Хөтөлбөр</dt><dd>{ENTRANCE_SUBJECT_ORDER.length}</dd></div>
        <div><dt>Бүтэн mock</dt><dd>{entranceTotal}</dd></div>
        <div><dt>Он</dt><dd>{years.length}</dd></div>
      </dl>
    </header>

    <nav className="eesh-subjects" aria-label="ЭЕШ-ийн хөтөлбөрүүд">
      {ENTRANCE_SUBJECT_ORDER.map(item => <Link key={item} href={entranceSubjectHrefs[item]} className="eesh-subject" aria-current={item === subject ? "page" : undefined}>
        <span className="eesh-subject-name">{entranceSubjectLabels[item]}</span>
        <strong>{counts[item]} mock</strong>
        <small>{entranceSubjectFormats[item]}</small>
      </Link>)}
    </nav>

    {freeMocksOf("entrance").filter(mock => mock.subject === subject).map(mock => <FreeMockTile key={mock.slug} mock={mock} />)}

    <section className="eesh-year-list" aria-label={entranceSubjectLabels[subject] + " шалгалтууд"}>
      {years.map(year => {
        const mocks = mocksForYear(subject, year);
        return <article className="eesh-year" key={year}>
          <header className="eesh-year-head">
            <h2>{year}</h2>
            <span>{mocks.length} хувилбар</span>
          </header>
          <div className="eesh-form-grid">
            {mocks.map(mock => <Link key={mock.slug} href={"/exams/" + mock.slug} className="eesh-form">
              <span className="eesh-form-code">{mock.form}</span>
              <strong>{mock.questionCount} даалгавар</strong>
              <span>{mock.points} оноо · {mock.durationMinutes} мин</span>
              <span className="eesh-form-open" aria-hidden="true">↗</span>
            </Link>)}
          </div>
        </article>;
      })}
    </section>

    <p className="fine-print eesh-hub-note">Нэг mock-ийн эрх ₮10,000 · ЭЕШ сарын багцад бүх ЭЕШ mock хязгааргүй багтана. Бүх даалгаврыг энэ сайтад зориулж зохиосон; БҮТ-ийн албан материал биш.</p>
  </div>;
}
