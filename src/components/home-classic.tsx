import Link from "next/link";
import { programs } from "@/modules/programs/catalog";
import { ProgramCard } from "@/components/program-card";
import { LawTestRecommendation } from "@/components/lawtest";

import { HomeAtmosphere } from "@/components/home-atmosphere";
import { HomeMotion } from "@/components/home-motion";
import { SpeakingInvitation } from "@/components/speaking-invitation";

// Set to false to return the home page to its plain background without deleting the component.
const SHOW_HOME_ATMOSPHERE = true;
const tickerItems = ["Digital SAT", "IELTS Academic", "ЭЕШ · 155 mock", "Математик · Физик · Англи", "Speaking workshop", "Writing workshop"];

const resources = [
  { href: "/exams/eesh", label: "ЭЕШ mock", title: "ЭЕШ · 155 mock", note: "Математик · Физик · Англи", mark: "∑" },
  { href: "/programs/entrance", label: "University Prep", title: "ЭЕШ бэлтгэл", note: "155 бүтэн mock · Нэг эрхэд", mark: "◈" },
  { href: "/workshop", label: "Workshop", title: "Ярих, бичих бэлтгэл", note: "AI хамтрагч · Эссэ засвар", mark: "→" },
];

export function HomeClassic() {
  return <>
    {SHOW_HOME_ATMOSPHERE ? <HomeAtmosphere variant="orbit" /> : null}
    <HomeMotion>
      <section className="hero">
      <div className="hero-copy" data-reveal>
        <div className="hero-meta"><span className="pill"><i className="live-dot" aria-hidden="true" />2026 · ШИНЭ БЭЛТГЭЛ</span><span className="hero-meta-note">SAT · IELTS · ЭЕШ</span></div>
        <h1>Том зорилго.<br /><span>Өдөр бүрийн</span><br />жижиг алхам.</h1>
        <p className="hero-description">Хаана хүрэхээ чи сонго.<br />Харин бэлтгэлээ нэг бодлогоос эхлүүл.</p>
        <div className="hero-actions"><Link className="button" href="/exams">Бүтэн шалгалт өгөх <span aria-hidden="true">↗</span></Link><Link className="text-link" href="/programs">Хөтөлбөрөө сонгох <span aria-hidden="true">→</span></Link></div>
        <div className="hero-stats" aria-label="Бэлтгэлийн хэмжээ">
          <div><strong>98</strong><span>SAT асуулт</span></div>
          <div><strong>155</strong><span>ЭЕШ mock</span></div>
          <div><strong>04</strong><span>IELTS чадвар</span></div>
        </div>
      </div>
      <aside data-reveal className="launch-panel" aria-labelledby="launch-heading">
        <div className="launch-heading"><span className="eyebrow">БЭЛТГЭЛЭЭ ЭХЛҮҮЛ</span><span className="launch-icon" aria-hidden="true">↗</span></div>
        <h2 id="launch-heading">Өнөөдөр нэг алхам урагш.</h2>
        <p>SAT, IELTS эсвэл ЭЕШ — өөрт тохирох шалгалтаа сонго.</p>
        <Link href="/exams/sat" className="launch-option"><span className="launch-symbol">SAT</span><span><strong>Digital SAT</strong><small>98 асуулт · 2ц 14м + завсарлага · ₮10,000</small></span><span className="launch-arrow" aria-hidden="true">↗</span></Link>
        <Link href="/exams/ielts" className="launch-option"><span className="launch-symbol ielts">IELTS</span><span><strong>IELTS Academic</strong><small>Бүх 4 чадвар · ₮10,000</small></span><span className="launch-arrow" aria-hidden="true">↗</span></Link>
        <Link className="launch-practice" href="/exams/eesh"><span><strong>ЭЕШ · 155 mock</strong><small>Математик · Физик · Англи</small></span><span aria-hidden="true">→</span></Link>
        <div className="launch-note"><span aria-hidden="true">◷</span> Хариугаа хадгалаад, орхисон газраасаа үргэлжлүүл.</div>
      </aside>
    </section>

    <div className="home-ticker" data-reveal aria-hidden="true">
      <div className="home-ticker-track">{tickerItems.map(item => <span key={item}>{item}<i>✳</i></span>)}</div>
      <div className="home-ticker-track">{tickerItems.map(item => <span key={item}>{item}<i>✳</i></span>)}</div>
    </div>

    <section className="section" aria-labelledby="programs-heading"><div className="section-heading" data-reveal><div><p className="eyebrow">ЧИНИЙ ДАРААГИЙН ЗОРИЛГО</p><h2 id="programs-heading">Аль шалгалтад бэлдэх вэ?</h2></div><Link className="text-link" href="/programs">Бүгдийг үзэх ↗</Link></div>
      <div className="program-grid">{programs.map(program => <div data-reveal key={program.slug}><ProgramCard program={program} /></div>)}</div>
    </section>

    <SpeakingInvitation />

    <section data-reveal id="approach" className="approach section"><div><p className="eyebrow">БЭЛТГЭЛЭЭ ЭНГИЙН БОЛГО</p><h2>Зөв хариунаас <br />цааш суралц.</h2><p>Шалгалтаа сонгоод, бодит хугацаатайгаар бэлтгэлээ шалгаарай.</p></div>
      <ol className="approach-steps"><li><span>01</span><div><h3>Эхлээд өөрөө бод</h3><p>Хариугаа сонгоод, дараагийн бодлогод шилж.</p></div></li><li><span>02</span><div><h3>Тайлбартай нь шалга</h3><p>Яагаад зөв болохыг алхам бүрээр нь ойлго.</p></div></li><li><span>03</span><div><h3>Дахин оролдоод бататга</h3><p>Алдсан бодлогоо эргэж хараад, аргаа сайжруул.</p></div></li></ol>
    </section>

    <section className="home-resources" aria-labelledby="resources-heading" data-reveal>
      <div className="section-heading"><div><p className="eyebrow">ШУУД ҮСРЭХ</p><h2 id="resources-heading">Өнөөдрийн бэлтгэл.</h2></div><Link className="text-link" href="/exams">Бүх материал ↗</Link></div>
      <div className="home-bento">{resources.map(item => <Link className="bento-card" href={item.href} key={item.href}><em>{item.label}</em><span><strong>{item.title}</strong><small>{item.note}</small></span><span>{item.mark}<span aria-hidden="true">↗</span></span></Link>)}</div>
    </section>

    <div data-reveal><LawTestRecommendation detailed /></div>
    </HomeMotion>
  </>;
}
