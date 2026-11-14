import Link from "next/link";
import type { FreeMock } from "./catalog";
import styles from "./free.module.css";

const programLabels: Record<string, string> = { sat: "Digital SAT", ielts: "IELTS Academic", jlpt: "JLPT", hsk: "HSK 1" };
const subjectLabels: Record<string, string> = { math: "Математик", physics: "Физик", chemistry: "Хими", biology: "Биологи", english: "Англи хэл" };
/** "ЭЕШ · Математик", "JLPT N5", "IELTS Academic": how a free mock is named in lists. */
export function freeMockLabel(mock: FreeMock) {
  if (mock.program === "entrance") return "ЭЕШ · " + (mock.subject ? subjectLabels[mock.subject] : "");
  return mock.level ? `JLPT ${mock.level}` : programLabels[mock.program] ?? mock.title;
}

/** One free half-length mock, as a highlighted first tile in its programme's hub; the hubs are the only place free
 * mocks are listed (owner rule 2026-11-14: not on the /exams library). */
export function FreeMockTile({ mock }: { mock: FreeMock }) {
  return <Link className={styles.tile} href={"/exams/" + mock.slug} data-free-mock={mock.slug}>
    <span className={styles.badge}>ҮНЭГҮЙ · ХАГАС MOCK</span>
    <strong>{freeMockLabel(mock)}</strong>
    <span className={styles.meta}>{mock.questions} асуулт · {mock.minutes} минут{mock.listening ? " · сонсох audio-той" : ""}</span>
    <span className={styles.go} aria-hidden="true">Эхлэх →</span>
  </Link>;
}
