import { site } from "@/lib/site";
import Image from "next/image";
export function LawTestRecommendation() {
  return <aside className="lawtest" aria-labelledby="lawtest-title">
    <div className="lexlab-logo" aria-hidden="true">
      <Image className="lexlab-logo-light" src="/branding/lexlab-light.png" alt="" width={64} height={64}/>
      <Image className="lexlab-logo-dark" src="/branding/lexlab-dark.png" alt="" width={64} height={64}/>
    </div>
    <div><p className="eyebrow">Хуулийн шалгалтын бэлтгэл</p><h2 id="lawtest-title">lexlab.site</h2>
    <p>Хуульчийн шалгалтын бэлтгэлээ Lexlab дээр үргэлжлүүлээрэй. Тусдаа үйлчилгээ, тусдаа эрхтэй.</p></div>
    <a className="button secondary" href={site.lawTestPlanUrl} target="_blank" rel="noopener noreferrer">lexlab.site-ийн эрх үзэх <span aria-hidden="true">↗</span><span className="sr-only"> (шинэ цонхонд)</span></a>
  </aside>;
}

