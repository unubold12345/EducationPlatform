import Image from "next/image";
import Link from "next/link";
import { pricedPlans } from "@/modules/subscriptions/prices";
import { homePrograms, totalMocks, labCount, HomeProgramDetails, HomeWorkspaceDetails, HomeWorkshopDetails, HomePlans, HomeQuestions } from "@/components/home-details";
import { LawTestRecommendation } from "@/components/lawtest";
import { HomeAtmosphere } from "@/components/home-atmosphere";
import { HomeMotion } from "@/components/home-motion";
import { HOME_ART_STYLE, homeArtwork } from "@/components/home-art";
import { entranceTotal } from "@/modules/exams/entrance/catalog";

const tickerItems = ["Digital SAT", "IELTS Academic", `ЭЕШ · ${entranceTotal} mock`, "JLPT · N5 / N4", "HSK 1", "AI туслах", "Үгсийн сан", "Speaking", "Reading"];

export async function HomeClassic() {
  const plans = await pricedPlans();
  return <>
    <HomeAtmosphere variant="orbit" />
    <HomeMotion className={"home-page home-art-" + HOME_ART_STYLE}>
      <section className="hero">
        <div className="hero-copy" data-reveal>
          <h1>Том зорилго.<br /><span>Өдөр бүрийн</span><br />жижиг алхам.</h1>
          <p className="hero-description">Шалгалтаа давт. Алдаагаа ойлго.<br />Өөрийн хэмнэлээр урагшил.</p>
          <div className="hero-actions"><Link className="button" href="/workspace">Workspace нээх <span aria-hidden="true">↗</span></Link><Link className="home-watch-link" href="#demos"><span aria-hidden="true">▶</span> Хэрхэн ажилладаг вэ?</Link></div>
          <div className="hero-stats" aria-label="Бэлтгэлийн боломжууд"><div><strong>{String(homePrograms.length).padStart(2, "0")}</strong><span>Хөтөлбөр</span></div><div><strong>{totalMocks}</strong><span>Бүтэн mock</span></div><div><strong>{String(labCount()).padStart(2, "0")}</strong><span>Хэлний студи</span></div></div>
        </div>
        <div className="home-hero-visual" data-reveal>
          <div className="home-hero-photo"><Image src={homeArtwork.studyHero.src} alt={homeArtwork.studyHero.alt} fill sizes="(max-width: 760px) 100vw, 52vw" loading="eager" fetchPriority="high" /></div>
          <aside className="launch-panel" aria-label="Шалгалтаа сонгох"><span className="eyebrow">ХААНААС ЭХЛЭХ ВЭ?</span><div>{[{ title: "SAT", href: "/exams/sat" }, { title: "IELTS", href: "/exams/ielts" }, { title: "ЭЕШ", href: "/exams/eesh" }, { title: "JLPT", href: "/exams/jlpt" }, { title: "HSK", href: "/exams/hsk" }].map(item => <Link key={item.href} href={item.href}>{item.title}<span aria-hidden="true">↗</span></Link>)}</div></aside>
        </div>
      </section>
      <div className="home-ticker" data-reveal aria-hidden="true">{[0, 1].map(index => <div className="home-ticker-track" key={index}>{tickerItems.map(item => <span key={item}>{item}<i>✳</i></span>)}</div>)}</div>
      <section className="section home-programs" id="programs" aria-labelledby="programs-heading">
        <div className="section-heading" data-reveal><h2 id="programs-heading">Хөтөлбөрүүд</h2></div>
        <nav className="home-program-index" aria-label="Хөтөлбөрийн товчоон">{homePrograms.map(program => <Link className="program-card" key={program.slug} href={"#program-" + program.slug}><span aria-hidden="true">{program.symbol}</span>{program.slug === "entrance" ? "ЭЕШ" : program.title}<span aria-hidden="true">↓</span></Link>)}</nav>
        <HomeProgramDetails plans={plans} />
      </section>
      <HomeWorkspaceDetails />
      <HomeWorkshopDetails />
      <HomePlans plans={plans} />
      <HomeQuestions />
      <section className="home-start" aria-label="Бэлтгэлээ эхлэх" data-reveal><p><strong>Бүртгэл үнэгүй.</strong> Сар бүр 100 AI кредит, нэг mock-оос эхэлж болно.</p><Link className="button" href="/workspace">Бэлтгэлээ эхлэх <span aria-hidden="true">↗</span></Link></section>
      <div data-reveal><LawTestRecommendation /></div>
    </HomeMotion>
  </>;
}
