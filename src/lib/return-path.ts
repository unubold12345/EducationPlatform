import "server-only";
import { findOfficialPaper,officialPaperCategory } from "@/modules/papers/catalog";
import { findExam } from "@/modules/exams/definitions";
import { findSubscriptionPlan } from "@/modules/subscriptions/plans";

// Only exact known app paths survive sign-in; anything else returns to the dashboard.
export function safeReturnPath(value: unknown) {
  if (typeof value !== "string") return "/dashboard";
  if (value === "/labs/ielts-speaking") return value;
  if (value === "/profile") return value;
  if (value === "/admin") return value;
  if (value === "/exams/"+officialPaperCategory.slug) return value;
  if (value === "/exams/eec-english") return value;
  if (value.startsWith("/exams/eec-english/")&&findOfficialPaper(value.slice("/exams/eec-english/".length))) return value;
  if (value === "/plans") return value;
  if (value.startsWith("/subscribe/") && findSubscriptionPlan(value.slice(11))) return value;
  if (value.startsWith("/checkout/") && (findExam(value.slice(10))||findOfficialPaper(value.slice(10)))) return value;
  if (value.startsWith("/exams/") && (findExam(value.slice(7))||findOfficialPaper(value.slice(7)))) return value;
  return "/dashboard";
}
