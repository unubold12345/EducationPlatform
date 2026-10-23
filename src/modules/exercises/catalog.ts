import { findOfficialPaper } from "@/modules/papers/catalog";
import "server-only";
export { exerciseSets, findExercise, publicExercise } from "./content";
import { exerciseSets } from "./content";
import { findExam } from "@/modules/exams/definitions";
import { findSubscriptionPlan } from "@/modules/subscriptions/plans";

export function exerciseReturnPath(value: unknown) {
  if (typeof value !== "string") return "/dashboard";
  if (value === "/profile") return value;
  if (value === "/admin") return value;
  if (value === "/plans") return value;
  if (value.startsWith("/subscribe/") && findSubscriptionPlan(value.slice(11))) return value;
  if (value.startsWith("/checkout/") && (findExam(value.slice(10))||findOfficialPaper(value.slice(10)))) return value;
  if (exerciseSets.some(set => value === "/exercises/" + set.slug)) return value;
  if (value.startsWith("/exams/") && (findExam(value.slice(7))||findOfficialPaper(value.slice(7)))) return value;
  return "/dashboard";
}
