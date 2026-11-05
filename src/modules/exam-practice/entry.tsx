import Link from "next/link";
import "./practice.css";

// The second way into a mock or paper, shown on its briefing beside the timed start.
export function PracticeEntry({slug,hasAccess}:{slug:string;hasAccess:boolean}) {
  return <section className="practice-entry" aria-labelledby="practice-entry-heading">
    <h2 id="practice-entry-heading">Дадлагын горим</h2>
    <p>Цаг хэмжихгүй. Асуулт бүрийн хариуг шууд шалгаж, тайлбарыг уншиж, AI туслахаас асууж болно. Үр дүн шалгалтын түүхэнд орохгүй.</p>
    {hasAccess?<Link className="button secondary" href={"/exams/"+slug+"/practice"}>Дадлагын горим нээх →</Link>:<p>Энэ шалгалтын эрхэд багтсан.</p>}
  </section>;
}
