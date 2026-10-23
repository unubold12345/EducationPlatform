export const dynamic="force-dynamic";
import { getExercise } from "@/modules/content/published";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exerciseSets, publicExercise } from "@/modules/exercises/catalog";
import { PracticeClient } from "@/modules/practice/practice-client";
import { StartAttempt } from "@/modules/attempts/start-button";
import { findProgram } from "@/modules/programs/catalog";
import { getSession } from "@/lib/session";
import { hasSubscription } from "@/modules/subscriptions/access";
import { ProgramGate } from "@/components/program-gate";

export function generateStaticParams() { return exerciseSets.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return { title: (await getExercise((await params).slug))?.title ?? "Дасгал олдсонгүй" };
}
export default async function ExercisePage({ params }: { params: Promise<{ slug: string }> }) {
  const set = await getExercise((await params).slug);
  if (!set) notFound();
  const session=await getSession();
  if(!session||!await hasSubscription(session.user.id,set.program))return <ProgramGate program={set.program} title={set.title}/>;
  const exercise = publicExercise(set);
  return <div className="container practice-page exercise-page">
    <Link className="text-link" href={"/programs/" + exercise.program}>← {findProgram(exercise.program)!.title}</Link>
    <div className="practice-heading"><p className="eyebrow">{exercise.subject} · Сэдэвчилсэн дасгал</p><h1>{exercise.title}</h1><p>{exercise.questions.length} асуулт · Санал болгох хугацаа {exercise.minutes} минут · Хугацааны хязгааргүй</p></div>
    <div className="notice">Өөрсдийн зохиосон бэлтгэлийн материал. Сарын эрхэд багтсан дасгал. Үр дүнгээ хадгалах бол доорх товчийг сонгоно уу. Албан ёсны шалгалтын оноонд хөрвүүлэхгүй.</div>
    <div className="guest-save-prompt"><p>Дараа үргэлжлүүлж, үр дүнгээ хадгалах уу?</p><StartAttempt examId={exercise.examId} label="Бүртгэлд хадгалж хийх →" /></div>
    <PracticeClient questions={exercise.questions} exercise={{ slug: exercise.slug, program: exercise.program, subject: exercise.subject, examId: exercise.examId }} />
  </div>;
}
