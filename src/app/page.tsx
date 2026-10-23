import Link from "next/link";
import { programs } from "@/modules/programs/catalog";
import { ProgramCard } from "@/components/program-card";
import { LawTestRecommendation } from "@/components/lawtest";

export default function HomePage() {
  return <div className="container home-page">
    <section className="hero">
      <div className="hero-copy"><div className="pill">ӨӨРИЙН ХЭМНЭЛЭЭР. ЗОРИЛГЫНХОО ТӨЛӨӨ.</div>
        <h1>Том зорилго.<br /><span>Өдөр бүрийн</span><br />жижиг алхам.</h1>
        <p className="hero-description">Хаана хүрэхээ чи сонго.<br />Харин бэлтгэлээ нэг бодлогоос эхлүүл.</p>
        <div className="hero-actions"><Link className="button" href="/exams">Бүтэн шалгалт өгөх <span aria-hidden="true">↗</span></Link><Link className="text-link" href="/programs">Дасгалаа сонгох <span aria-hidden="true">→</span></Link></div>
        <p className="fine-print">Богино жишиг дасгал үнэгүй. Бүх бэлтгэлдээ сарын багцаар нэвтрээрэй.</p>
      </div>
      <aside className="launch-panel" aria-labelledby="launch-heading">
        <div className="launch-heading"><span className="eyebrow">БЭЛТГЭЛЭЭ ЭХЛҮҮЛ</span><span className="launch-icon" aria-hidden="true">↗</span></div>
        <h2 id="launch-heading">Өнөөдөр нэг алхам урагш.</h2>
        <p>Бүтэн шалгалт эсвэл сэдэвчилсэн дасгал — өөрт тохирохоо сонго.</p>
        <Link href="/exams/sat-full-01" className="launch-option"><span className="launch-symbol">SAT</span><span><strong>Digital SAT</strong><small>98 асуулт · 2ц 14м + завсарлага · ₮10,000</small></span><span className="launch-arrow" aria-hidden="true">↗</span></Link>
        <Link href="/exams/ielts-academic-01" className="launch-option"><span className="launch-symbol ielts">IELTS</span><span><strong>IELTS Academic</strong><small>Бүх 4 чадвар · ₮10,000</small></span><span className="launch-arrow" aria-hidden="true">↗</span></Link>
        <Link className="launch-practice" href="/practice"><span><strong>Эхлээд богино дасгал хийе</strong><small>SAT Algebra · 3 асуулт · Бүртгэлгүй</small></span><span aria-hidden="true">→</span></Link>
        <div className="launch-note"><span aria-hidden="true">◷</span> Хариугаа хадгалаад, орхисон газраасаа үргэлжлүүл.</div>
      </aside>
    </section>
    <section className="section" aria-labelledby="programs-heading"><div className="section-heading"><div><p className="eyebrow">Чиний дараагийн зорилго</p><h2 id="programs-heading">Аль шалгалтад бэлдэх вэ?</h2></div><Link className="text-link" href="/programs">Бүгдийг үзэх ↗</Link></div>
      <div className="program-grid">{programs.map(program => <ProgramCard key={program.slug} program={program} />)}</div>
    </section>
    <section id="approach" className="approach section"><div><p className="eyebrow">Бэлтгэлээ энгийн болго</p><h2>Зөв хариунаас <br />цааш суралц.</h2><p>Сэдвээ сонгоод, багц дасгалаар бэлтгэлээ бататгаарай.</p></div>
      <ol className="approach-steps"><li><span>01</span><div><h3>Эхлээд өөрөө бод</h3><p>Хариугаа сонгоод, дараагийн бодлогод шилж.</p></div></li><li><span>02</span><div><h3>Тайлбартай нь шалга</h3><p>Яагаад зөв болохыг алхам бүрээр нь ойлго.</p></div></li><li><span>03</span><div><h3>Дахин оролдоод бататга</h3><p>Алдсан бодлогоо эргэж хараад, аргаа сайжруул.</p></div></li></ol>
    </section>
    <LawTestRecommendation />
  </div>;
}


