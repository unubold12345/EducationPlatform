import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { MyExams } from "@/modules/my-exams/client";

export const metadata: Metadata = { title: "Файлаас шалгалт" };

export default async function MyExamsPage() {
  const user = await requireUser("/workspace/my-exams");
  return <MyExams userKey={user.id} />;
}
