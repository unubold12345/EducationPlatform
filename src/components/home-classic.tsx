import Image from "next/image";
import Link from "next/link";
import { pricedPlans } from "@/modules/subscriptions/prices";
import { homePrograms, totalMocks, labCount, HomeProgramDetails, HomeWorkspaceDetails, HomeWorkshopDetails, HomePlans, HomeQuestions } from "@/components/home-details";
import { LawTestRecommendation } from "@/components/lawtest";
import { HomeAtmosphere } from "@/components/home-atmosphere";
import { HomeMotion } from "@/components/home-motion";
import { HOME_ART_STYLE, homeArtwork } from "@/components/home-art";
import { entranceTotal } from "@/modules/exams/entrance/catalog";

const tickerItems = ["Digital SAT", "IELTS Academic", `ЭЕШ · ${entranceTotal} mock`, "JLPT · N5 / N4", "HSK 1", "Speaking", "Writing"];

export async function HomeClassic() {
  const plans = await pricedPlans();
  return <>
    <HomeAtmosphere variant="orbit" />
    <HomeMotion className={"home-page home-art-" + HOME_ART_STYLE}>
      <section className="hero">
        <div className="hero-copy" data-reveal>
          <div className="hero-meta"><span className="pill"><i className="live-dot" aria-hidden="true" />ЧИНИЙ ДАРААГИЙН АЛХАМ</span></div>
          <h1>Том зорилго.<br /><span>Өдөр бүрийн</span><br />жижиг алхам.</h1>
          <p className="hero-description">Шалгалтаа давт. Алдаагаа ойлго.<br />Өөрийн хэмнэлээр урагшил.</p>
          <div className="hero-actions"><Link className="button" href="/workspace">Workspace нээх <span aria-hidden="true">↗</span></Link><Link className="home-watch-link" href="#demos"><span aria-hidden="true">▶</span> Хэрхэн ажилладаг вэ?</Link></div>
          <div className="hero-stats" aria-label="Бэлтгэлийн боломжууд"><div><strong>{String(homePrograms.length).padStart(2, "0")}</strong><span>Хөтөлбөр</span></div><div><strong>{totalMocks}</strong><span>Бүтэн mock</span></div><div><strong>{String(labCount()).padStart(2, "0")}</strong><span>Хэлний студи</span></div></div>
        </div>
        <div className="home-hero-visual" data-reveal>
          <div className="home-hero-photo"><Image src={homeArtwork.studyHero.src} alt={homeArtwork.studyHero.alt} fill sizes="(max-width: 760px) 100vw, 52vw" loading="eager" fetchPriority="high" /><span className="home-photo-label">ӨӨРИЙН ИРЭЭДҮЙД ЦАГ ГАРГА.</span></div>
          <div className="home-photo-seal" aria-hidden="true"><span>Өдөр бүр</span><strong>+1 алхам</strong><span>өөртөө ойр.</span></div>
          <aside className="launch-panel" aria-label="Шалгалтаа сонгох"><span className="eyebrow">ХААНААС ЭХЛЭХ ВЭ?</span><div>{[{ title: "SAT", href: "/exams/sat" }, { title: "IELTS", href: "/exams/ielts" }, { title: "ЭЕШ", href: "/exams/eesh" }, { title: "JLPT", href: "/exams/jlpt" }, { title: "HSK", href: "/exams/hsk" }].map(item => <Link key={item.href} href={item.href}>{item.title}<span aria-hidden="true">↗</span></Link>)}</div></aside>
        </div>
      </section>
      <div className="home-ticker" data-reveal aria-hidden="true">{[0, 1].map(index => <div className="home-ticker-track" key={index}>{tickerItems.map(item => <span key={item}>{item}<i>✳</i></span>)}</div>)}</div>
      <section className="section home-programs" id="programs" aria-labelledby="programs-heading">
        <div className="section-heading" data-reveal><div><p className="eyebrow">ЗОРИЛГООС ЧИНЬ ЭХЭЛНЭ</p><h2 id="programs-heading">Чи хаашаа хүрмээр байна?</h2></div><p>Таван чиглэл. Нэг Workspace.</p></div>
        <nav className="home-program-index" aria-label="Хөтөлбөрийн товчоон">{homePrograms.map(program => <Link className="program-card" key={program.slug} href={"#program-" + program.slug}><span aria-hidden="true">{program.symbol}</span>{program.slug === "entrance" ? "ЭЕШ" : program.title}<span aria-hidden="true">↓</span></Link>)}</nav>
        <HomeProgramDetails plans={plans} />
      </section>
      <HomeWorkspaceDetails />
      <HomeWorkshopDetails />
      <HomePlans plans={plans} />
      <HomeQuestions />
      <section className="home-start" aria-labelledby="home-start-heading" data-reveal><div><p className="eyebrow">ДАРААГИЙН АЛХМАА ӨНӨӨДӨР ХИЙ.</p><h2 id="home-start-heading">Зорилго чинь чамайг хүлээж байна.</h2></div><Link className="button" href="/workspace">Бэлтгэлээ эхлэх <span aria-hidden="true">↗</span></Link></section>
      <div data-reveal><LawTestRecommendation /></div>
    </HomeMotion>
  </>;
}
