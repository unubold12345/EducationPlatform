import Link from "next/link";
import { findSubscriptionPlan } from "@/modules/subscriptions/plans";
export function ProgramGate({program,title}:{program:string;title:string}) {
  const plan=findSubscriptionPlan(program)!;
  return <div className="container page-space program-gate"><Link className="text-link" href={"/programs/"+program}>← Хөтөлбөр рүү</Link><section className="settings-card"><span className="settings-icon" aria-hidden="true">◇</span><p className="eyebrow">САРЫН БАГЦАД БАГТСАН</p><h1>{title}</h1><p>{plan.title} багцаар энэ хөтөлбөрийн бүх дасгал{program!=="entrance"?", бүтэн mock шалгалт":""}-ыг ашиглаарай.</p><div className="gate-price">₮{plan.amountMnt.toLocaleString("en-US")}<span> / сар</span></div><Link className="button" href={"/subscribe/"+program}>Сарын эрх нээх →</Link><Link className="text-link" href="/plans">Бүх багц харах ↗</Link><p className="fine-print">Туршилтын төлбөр · Бодит мөнгө суутгахгүй.</p></section></div>;
}
