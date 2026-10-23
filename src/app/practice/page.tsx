import type { Metadata } from "next";
import Link from "next/link";
import { PracticeClient } from "@/modules/practice/practice-client";
import { questions } from "@/modules/practice/questions";
export const metadata: Metadata = { title: "SAT математикийн жишиг дасгал" };
export default function PracticePage() {
  return <div className="container practice-page"><div className="practice-heading"><p className="eyebrow">SAT · Mathematics · Algebra</p><h1>Нэг бодлогоос эхэлье.</h1><p>3 жишиг бодлого · Хугацааны хязгааргүй · Бүртгэлгүй</p></div>
    <div className="notice">Энэ бол үйлдлийг турших жишиг дасгал. Албан ёсны SAT материал биш. Үр дүн хадгалагдахгүй бөгөөд SAT оноонд хөрвүүлэхгүй.</div>
    <div className="guest-save-prompt"><p>Хариултаа хадгалж, дараа үргэлжлүүлэх үү?</p><Link className="text-link" href="/dashboard">Миний бэлтгэл рүү →</Link></div><PracticeClient questions={questions} />
  </div>;
}


