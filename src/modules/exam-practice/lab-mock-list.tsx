import Link from "next/link";
import type { LabMock } from "./lab-mocks";
import styles from "./lab-mocks.module.css";

/** The mocks of a Workshop lab as cards: progress on the ones the student may open, the price on locked ones. */
export function LabMockList({ mocks, unit = "асуулт" }: { mocks: LabMock[]; unit?: string }) {
  if (!mocks.length) return <p className={styles.empty}>Одоогоор mock алга.</p>;
  return <ul className={styles.list}>{mocks.map(mock => <li key={mock.slug}>
    <Link className={styles.card} href={mock.href} prefetch={false} data-locked={mock.open ? undefined : ""} data-mock={mock.slug}>
      <span className={styles.top}><strong>{mock.title.replace(/ · Free Half Mock$/, " · үнэгүй")}</strong><span className={styles.tag}>{mock.note}</span></span>
      {mock.theme ? <p className={styles.theme}>{mock.theme}</p> : null}
      <span className={styles.foot}>
        <span>{mock.questions} {unit}</span>
        {!mock.open ? <span>Mock-ийн хуудас →</span>
          : mock.checked ? <em data-full={mock.checked === mock.questions && mock.correct === mock.questions ? "" : undefined}>{mock.correct}/{mock.checked} зөв · {mock.checked}/{mock.questions}</em>
          : <span className={styles.go}>Эхлэх →</span>}
      </span>
    </Link>
  </li>)}</ul>;
}
