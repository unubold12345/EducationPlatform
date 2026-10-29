import { site } from "@/lib/site";
import Image from "next/image";

function LexlabLogo() {
  return <div className="lexlab-logo" aria-hidden="true">
    <Image className="lexlab-logo-light" src="/branding/lexlab-light.png" alt="" width={64} height={64}/>
    <Image className="lexlab-logo-dark" src="/branding/lexlab-dark.png" alt="" width={64} height={64}/>
  </div>;
}

function PlanLink({ label = "Lexlab-ийн эрх үзэх" }: { label?: string }) {
  return <a className="button secondary" href={site.lawTestPlanUrl} target="_blank" rel="noopener noreferrer">{label} <span aria-hidden="true">↗</span><span className="sr-only"> (шинэ цонхонд)</span></a>;
}

function LexlabVisual() {
  return <div className="lawtest-visual" aria-hidden="true">
    <span className="lexlab-orbit lexlab-orbit-one" />
    <span className="lexlab-orbit lexlab-orbit-two" />
    <span className="lexlab-chip lexlab-chip-a">A</span>
    <span className="lexlab-chip lexlab-chip-b">B</span>
    <span className="lexlab-chip lexlab-chip-c">C</span>
    <span className="lexlab-chip lexlab-chip-d">D</span>
    <span className="lexlab-chip lexlab-chip-s">§</span>
    <svg className="lexlab-scales" viewBox="0 0 180 150" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <g className="lexlab-beam">
        <path d="M24 38h132" />
        <path d="M60 38v7M120 38v7" />
        <path d="M60 45 42 71h36L60 45Z" />
        <path d="M120 45 102 71h36l-18-26Z" />
        <path d="M42 71c0 10 8 17 18 17s18-7 18-17" />
        <path d="M102 71c0 10 8 17 18 17s18-7 18-17" />
      </g>
      <path d="M90 38v75M62 118h56M74 118v10h32v-10" />
      <circle cx="90" cy="38" r="5" />
    </svg>
  </div>;
}

export function LawTestRecommendation({ detailed = false }: { detailed?: boolean }) {
  if (detailed) return <aside className="lawtest lawtest-detailed" aria-labelledby="lawtest-title">
    <span className="lawtest-mark" aria-hidden="true">§</span>
    <div className="lawtest-hero">
      <div className="lawtest-intro">
        <LexlabLogo />
        <div className="lawtest-heading">
          <p className="eyebrow">Хуулийн шалгалтын бэлтгэл</p>
          <h2 id="lawtest-title">Lexlab</h2>
          <p>Хуульчийн шалгалтын бэлтгэлээ Lexlab дээр үргэлжлүүлээрэй. Сорилго, шалгалт, хариулт, түүхээ нэг дор удирдана.</p>
        </div>
      </div>
      <div className="lawtest-cta">
        <LexlabVisual />
        <div className="lawtest-price"><strong>Бүтэн эрх</strong><span>нэг удаа · насан турш</span></div>
        <a className="button" href={site.lawTestPlanUrl} target="_blank" rel="noopener noreferrer">Lexlab-ийн эрх үзэх <span aria-hidden="true">↗</span><span className="sr-only"> (шинэ цонхонд)</span></a>
      </div>
    </div>
    <div className="lawtest-body">
      <div className="lawtest-features">
        <span className="lawtest-free">Үнэгүй · Нийтийн эрх зүйн 1,848 сорилго</span>
        <ul>
          <li>Бүх ангиллын сорилго</li>
          <li>Бүх ангиллаар шалгалт өгөх</li>
          <li>Зөв хариулт хадгалах</li>
          <li>Шалгалт түр зогсоож, үргэлжлүүлэх</li>
        </ul>
        <p className="fine-print">Шалгалтын түүх, календарь, хариулттай болон хариултгүй сорилго.</p>
      </div>
    </div>
  </aside>;

  return <aside className="lawtest" aria-labelledby="lawtest-title">
    <LexlabLogo />
    <div><p className="eyebrow">Хуулийн шалгалтын бэлтгэл</p><h2 id="lawtest-title">Lexlab</h2>
    <p>Хуульчийн шалгалтын бэлтгэлээ Lexlab дээр үргэлжлүүлээрэй.</p></div>
    <PlanLink />
  </aside>;
}
