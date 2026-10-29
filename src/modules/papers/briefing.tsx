import Link from "next/link";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { officialPaperCategory, slotsForPaper, type OfficialPaper } from "./catalog";
import { paperAccess } from "./service";
import { PaperStart } from "./start";
import { MOCK_PRICE_LABEL } from "../exams/pricing";

export async function OfficialPaperBriefing({ paper: officialPaper }: { paper: OfficialPaper }) {
  const custom = Boolean(officialPaper.slots);
  const english = officialPaper.subject === "english";
  const slots = slotsForPaper(officialPaper);
  const choiceCount = slots.filter(slot => slot.kind === "choice").length;
  const fillCount = slots.length - choiceCount;
  const session = await getSession();
  const old = session ? await getDb().paperAttempt.findFirst({ where: { userId: session.user.id, slug: officialPaper.slug, status: "IN_PROGRESS" }, select: { id: true } }) : null;
  const access = session && (Boolean(old) || await paperAccess(session.user.id, officialPaper.slug));
  const sourceNote = officialPaper.sourceNote ?? "БҮТ-ийн эх хуудсыг өөрчлөлтгүй хуулбараар харуулна. Асуулт, зураг, сонголтуудыг таамгаар дахин зохиогоогүй.";
  const categoryHref = officialPaper.categoryPath ?? "/exams/" + officialPaperCategory.slug;

  return <div className="container page-space official-briefing official-briefing-page">
    <div className="briefing-breadcrumb" role="navigation" aria-label="Шалгалтын зам">
      <Link className="text-link" href={categoryHref}>← {english ? "Англи хэл" : "2020 Математик"} · Бүх хувилбар</Link>
      <span aria-hidden="true">/</span>
      <span>{english ? `${officialPaper.year} · ${officialPaper.variant} хувилбар` : `${officialPaper.variant} хувилбар`}</span>
    </div>

    <header className="exam-briefing-hero official-hero">
      <div className="page-intro exam-briefing-copy entrance">
        <p className="eyebrow">БҮТ · АЛБАН ЁСНЫ ӨМНӨХ ОНЫ МАТЕРИАЛ</p>
        <h1>{officialPaper.title}</h1>
        <p>{`${officialPaper.year} оны бодит ЭЕШ-ийн эх хуудас болон таарсан түлхүүрт суурилсан шалгалт.`}</p>
        <ul className="briefing-chips" aria-label="Шалгалтын товч">
          <li>{officialPaper.year}</li>
          <li>{officialPaper.variant} хувилбар</li>
          <li>{english ? "Англи хэл" : "Математик"}</li>
          <li>Түлхүүртэй</li>
        </ul>
      </div>

      <aside className="exam-briefing-rail official-access" aria-label="Эрх ба үнэ">
        <div className="briefing-facts official-launch">
          <div className="briefing-facts-head"><span className="eyebrow">ЭРХ БА ҮНЭ</span><span className={access ? "status access-unlocked" : "status"}>{access ? "✓ Эрх нээлттэй" : MOCK_PRICE_LABEL}</span></div>
          <p className="briefing-price">{MOCK_PRICE_LABEL}<span> / нэг хувилбар · эсвэл University Prep</span></p>
          {old ? <p className="briefing-resume-note">Нээлттэй оролдлого байна — үргэлжлүүлэх боломжтой.</p> : null}
          {access ? <PaperStart slug={officialPaper.slug}/> : session ? <div className="briefing-actions">
            <Link className="button primary" href={"/checkout/" + officialPaper.slug}>Шалгалтын эрх авах · {MOCK_PRICE_LABEL}</Link>
            <Link className="button secondary" href="/subscribe/entrance">University Prep · ₮40,000 / сар</Link>
          </div> : <Link className="button primary" href={"/login?next=" + encodeURIComponent("/exams/" + officialPaper.slug)}>Нэвтэрч эхлэх →</Link>}
          <p className="fine-print briefing-payment-note">Төлбөр нь шалгалтын цаг эхлүүлэхгүй.</p>
        </div>
      </aside>
    </header>

    <div className="official-facts">
      <div><strong>{officialPaper.seconds / 60}</strong><span>минут · нэг тасралтгүй хугацаа</span></div>
      <div><strong>{choiceCount} + {fillCount}</strong><span>сонгох + нөхөх даалгавар</span></div>
      <div><strong>{officialPaper.totalMarks}</strong><span>{english && officialPaper.year < 2018 ? "зөв хариулт / нүд" : "анхны оноо"}</span></div>
      <div><strong>{officialPaper.pages}</strong><span>эх хуудас</span></div>
    </div>

    <div className="official-briefing-body">
      <section className="briefing-section official-structure" aria-labelledby="official-structure-heading">
        <div className="briefing-section-head"><span aria-hidden="true">01</span><div><p className="eyebrow">ТОО БА ОНОО</p><h2 id="official-structure-heading">Шалгалтын бүтэц</h2></div></div>
        {custom ? <>
          <div className="official-score-split">
            <div><strong>{choiceCount}</strong><span>сонгох · A–E</span></div>
            <div><strong>{fillCount}</strong><span>нөхөх · нэг цифр</span></div>
            <div><strong>{officialPaper.totalMarks}</strong><span>нийт оноо</span></div>
          </div>
          <p>{choiceCount} сонгох даалгавар · A–E. {fillCount} нөхөх даалгавар; нүд бүрт эх материалын зааврын дагуу нэг цифр оруулна.</p>
          {officialPaper.scoringNote ? <p className="official-limit">{officialPaper.scoringNote}</p> : null}
          {officialPaper.timingNote ? <p>{officialPaper.timingNote}</p> : null}
        </> : <>
          <div className="official-score-split">
            <div><strong>36</strong><span>сонгох · 72 оноо</span></div>
            <div><strong>4</strong><span>нөхөх · 28 оноо</span></div>
            <div><strong>100</strong><span>нийт оноо</span></div>
          </div>
          <p>1–11: тус бүр 1 оноо. 12–25: тус бүр 2 оноо. 26–36: тус бүр 3 оноо.</p>
          <p>2.1–2.4: тус бүр 7 оноо. a–g нүдэнд нэг нэг цифр бичнэ. Хос нүдний оноо нь тухайн хос бүхэлдээ зөв үед тооцогдоно.</p>
        </>}
      </section>

      <aside className="briefing-section official-rules" aria-labelledby="official-rules-heading">
        <div className="briefing-section-head"><span aria-hidden="true">02</span><div><p className="eyebrow">ЭХЛЭХЭЭС ӨМНӨ</p><h2 id="official-rules-heading">Хадгалалт ба үнэлгээ</h2></div></div>
        <div className="briefing-rule-grid">
          <div><h3>Цаг</h3><ul><li>Цаг эхлэх товч дарахад сервер дээр эхэлнэ. Refresh хийж, хааж нээхэд зогсохгүй.</li></ul></div>
          <div><h3>Хариулт</h3><ul><li>Хариулт автоматаар хадгалагдана. Цаг дуусахад серверт хадгалсан хариу эцэслэгдэнэ.</li><li>Бүх даалгавраа шалгаад эцэслэн илгээж болно. Илгээсэн хариу өөрчлөгдөхгүй.</li></ul></div>
          <div><h3>Оноо</h3><ul><li>Түлхүүртэй тулгаж {officialPaper.totalMarks} хүртэл оноо гарна.</li><li>200–800 хэмжээст оноо тооцохгүй.</li></ul></div>
        </div>
      </aside>
    </div>

    <details className="briefing-notes">
      <summary>Эх сурвалж ба тэмдэглэл</summary>
      <p className="fine-print">{sourceNote}</p>
      <p className="fine-print">Эх сурвалж: {officialPaper.publisher} · {officialPaper.year} · {officialPaper.variant}. Энэ нь EducationPlatform-ийн бэлтгэлийн орчин; албан ёсны шинэ шалгалт эсвэл БҮТ-ийн дүн баталгаажуулалт биш.</p>
      <div className="briefing-sources"><a href={officialPaper.sourceUrl} target="_blank" rel="noreferrer">БҮТ-ийн үнэгүй эх архив ↗</a><a href={officialPaper.timingSource} target="_blank" rel="noreferrer">Шалгалтын хугацааны эх сурвалж ↗</a></div>
    </details>
  </div>;
}
