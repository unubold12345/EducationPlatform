import { findOfficialPaper,officialPaperCategory } from "@/modules/papers/catalog";
import "server-only";
export { exerciseSets, findExercise, publicExercise } from "./content";
import { exerciseSets } from "./content";
import { findExam } from "@/modules/exams/definitions";
import { findSubscriptionPlan } from "@/modules/subscriptions/plans";

export function exerciseReturnPath(value: unknown) {
  if (typeof value !== "string") return "/dashboard";
  if (value === "/labs/ielts-speaking") return value;
  if (value === "/profile") return value;
  if (value === "/admin") return value;
  if (value === "/exams/"+officialPaperCategory.slug) return value;
  if (value === "/exams/dornod-2026") return value;
  if (value === "/exams/eec-english") return value;
  if (value.startsWith("/exams/eec-english/")&&findOfficialPaper(value.slice("/exams/eec-english/".length))) return value;
  if (value === "/plans") return value;
  if (value.startsWith("/subscribe/") && findSubscriptionPlan(value.slice(11))) return value;
  if (value.startsWith("/checkout/") && (findExam(value.slice(10))||findOfficialPaper(value.slice(10)))) return value;
  if (exerciseSets.some(set => value === "/exercises/" + set.slug)) return value;
  if (value.startsWith("/exams/") && (findExam(value.slice(7))||findOfficialPaper(value.slice(7)))) return value;
  return "/dashboard";
}
