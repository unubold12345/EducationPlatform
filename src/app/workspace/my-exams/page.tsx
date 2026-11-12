import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { MyExams } from "@/modules/my-exams/client";
import { myExamLibrary } from "@/modules/my-exams/service";

export const metadata: Metadata = { title: "Файлаас шалгалт" };

export default async function MyExamsPage() {
  const user = await requireUser("/workspace/my-exams");
  // The exams live on the account, so they are read here and the plan decides how many fit.
  const { exams, limit } = await myExamLibrary(user.id);
  return <MyExams userKey={user.id} limit={limit} initialExams={exams} />;
}
