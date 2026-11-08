import "server-only";
import { findExam } from "@/modules/exams/definitions";
import { findSubscriptionPlan } from "@/modules/subscriptions/plans";

// Only exact known app paths survive sign-in; anything else returns to the Workspace home.
const workspacePaths = ["/workspace", "/workspace/chat", "/workspace/review", "/workspace/workshop", "/workspace/profile", "/workspace/plans"];
export function safeReturnPath(value: unknown) {
  if (typeof value !== "string") return "/workspace";
  if (workspacePaths.includes(value)) return value;
  if (value === "/labs/ielts-speaking") return value;
  if (value === "/admin") return value;
  if (["/exams/sat","/exams/ielts","/exams/eesh"].includes(value)) return value;
  if (value.startsWith("/subscribe/") && findSubscriptionPlan(value.slice(11))) return value;
  if (value.startsWith("/checkout/") && findExam(value.slice(10))) return value;
  if (value.startsWith("/exams/") && findExam(value.slice(7))) return value;
  return "/workspace";
}
