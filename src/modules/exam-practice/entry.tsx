import Link from "next/link";
import "./practice.css";

// The second way into a mock or paper, shown on its briefing beside the timed start.
// `locked` explains why practice is closed (for example: pick the mock first, or sign in for a free mock).
export function PracticeEntry({slug,hasAccess,locked="Энэ шалгалтын эрхэд багтсан."}:{slug:string;hasAccess:boolean;locked?:string}) {
  return <section className="practice-entry" aria-labelledby="practice-entry-heading">
    <h2 id="practice-entry-heading">Дадлагын горим</h2>
    <p>Цаг хэмжихгүй. Асуулт бүрийн хариуг шууд шалгаж, тайлбарыг уншиж, AI туслахаас асууж болно. Үр дүн шалгалтын түүхэнд орохгүй.</p>
    {hasAccess?<Link className="button secondary" href={"/exams/"+slug+"/practice"}>Дадлагын горим нээх →</Link>:<p>{locked}</p>}
  </section>;
}
