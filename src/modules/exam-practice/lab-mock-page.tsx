import Link from "next/link";
import type { LabMock } from "./lab-mocks";
import { LabMockList } from "./lab-mock-list";
import styles from "./lab-mocks.module.css";

/** A Workshop lab that is a list of mocks: back to the exam's Workshop tab, a title, one line and the cards. */
export function LabMockPage({ exam, eyebrow, title, lead, mocks }: { exam: string; eyebrow: string; title: string; lead: string; mocks: LabMock[] }) {
  return <div className={`wsp-page ${styles.page}`}>
    <Link className={styles.back} href={"/workspace/workshop?exam=" + exam}>← Workshop</Link>
    <header className={styles.head}><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{lead}</p></header>
    <LabMockList mocks={mocks} />
  </div>;
}

/** The mock list inside another lab's page, under its own content (the JLPT/HSK/TOPIK reading practice). */
export function LabMockSection({ title, mocks }: { title: string; mocks: LabMock[] }) {
  return <section className={styles.section} aria-label={title}><h2>{title}</h2><LabMockList mocks={mocks} /></section>;
}
