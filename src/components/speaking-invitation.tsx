import Link from "next/link";
import { speakingLabEnabled } from "@/lib/local-pilot";

export function SpeakingInvitation() {
  if (!speakingLabEnabled()) return null;
  return <section className="speaking-invitation" aria-labelledby="speaking-invitation-heading" data-reveal>
    <div className="speaking-art" aria-hidden="true"><svg viewBox="0 0 240 180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M38 36h130a18 18 0 0 1 18 18v52a18 18 0 0 1-18 18H94l-30 24v-24H38a18 18 0 0 1-18-18V54a18 18 0 0 1 18-18Z"/><path d="M62 69v23m16-36v49m16-39v29m16-45v61m16-45v29m16-39v49m16-36v23M183 12l4 10 11 4-11 4-4 10-4-10-11-4 11-4ZM193 139l17 7-17 7m-22 7h26"/></svg><span>Every voice starts somewhere.</span></div>
    <div className="speaking-invitation-copy"><p className="eyebrow">IELTS Speaking · AI хамтрагч</p><h2 id="speaking-invitation-heading">Бодлоо англиар.<br />Өөрийнхөө дуугаар.</h2><p>Ярианы 3 хэсгээр бэлтгэж, AI хамтрагчтайгаа ярилцаарай. Бичсэн хариултаар ч оролцож болно.</p><Link className="button" href="/labs/ielts-speaking" prefetch={false}>Ярианы бэлтгэл эхлэх <span aria-hidden="true">↗</span></Link><p className="fine-print">Туршилтын AI зөвлөмж · Албан ёсны IELTS band биш.</p></div>
  </section>;
}
