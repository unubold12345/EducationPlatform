import "server-only";
import Link from "next/link";
import { activeTimedSitting } from "@/modules/exams/active-sitting";
import type { LanguageExam } from "./catalog";
import { hasLanguageStudy, languageStudyPlans } from "./service";
import styles from "./decks.module.css";

/**
 * The page-side check shared by the deck, Kana and Pinyin pages: the plan (Гадаад хэл Basic or Pro), then no timed
 * sitting. Returns the panel to show instead of the page, or null when the student may study. The review route checks
 * the same again.
 */
export async function studyGate(userId: string, exam: LanguageExam, title: string) {
  const back = <Link className={styles.back} href={"/workspace/workshop?exam=" + exam}>← Workshop</Link>;
  if (!await hasLanguageStudy(userId, exam)) {
    return <div className={`wsp-page ${styles.page}`}>{back}<section className={styles.locked}><h1>{title}</h1>
      <p>Энэ хэсэг {languageStudyPlans(exam).join(", ")} багцад багтана.</p>
      <Link className={styles.lockedLink} href="/workspace/plans">Багц харах →</Link></section></div>;
  }
  const sitting = await activeTimedSitting(userId);
  if (sitting) {
    return <div className={`wsp-page ${styles.page}`}>{back}<section className={styles.locked}><h1>{title}</h1>
      <p>Цагтай шалгалт явагдаж байхад энэ хэсэг нээгдэхгүй.</p><Link className={styles.lockedLink} href={sitting.href}>Шалгалт руу буцах →</Link></section></div>;
  }
  return null;
}
