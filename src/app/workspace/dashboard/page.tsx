import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { activity, creditOverview, goalProgress, listGoals, listTasks, taskWindow, today as ubToday } from "@/modules/dashboard/service";
import { Dashboard } from "@/modules/dashboard/dashboard";

export const metadata: Metadata = { title: "Хянах самбар" };

// Student dashboard (owner request 2026-11-20): exam goals with level and booked date, a day-by-day to-do carousel,
// a year of daily activity, exam facts and the AI credit history. Everything is read for the signed-in student only.
export default async function WorkspaceDashboard() {
  const user = await requireUser("/workspace/dashboard");
  const today = ubToday();
  const range = taskWindow(today);
  const [goals, tasks, grid, credits] = await Promise.all([
    listGoals(user.id),
    listTasks(user.id, range.from, range.to),
    activity(user.id, today),
    creditOverview(user.id),
  ]);
  const progress = await goalProgress(user.id, goals);
  return <Dashboard name={user.name} today={today} goals={goals} progress={progress} tasks={tasks} range={range} grid={grid} credits={credits} />;
}
