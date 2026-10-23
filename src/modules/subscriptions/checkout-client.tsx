"use client";
import { useRef,useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatBillingDate } from "./plans";
type Receipt={id:string;periodEnd:string;amountMnt:number;status:string};
export function SubscriptionCheckout({program,amountMnt,renew,enabled}:{program:string;amountMnt:number;renew:boolean;enabled:boolean}) {
  const router=useRouter();const orderId=useRef<string|null>(null);const busy=useRef(false);
  const [pending,setPending]=useState(false),[error,setError]=useState(""),[receipt,setReceipt]=useState<Receipt|null>(null);
  async function pay(decision:"success"|"decline") {
    if(busy.current)return;busy.current=true;setPending(true);setError("");
    try {
      if(!orderId.current) {
        const response=await fetch("/api/subscriptions/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({program}),signal:AbortSignal.timeout(15000)});
        if(response.status===401){router.push("/login?next="+encodeURIComponent("/subscribe/"+program));return;}
        if(!response.ok)throw Error("order");orderId.current=(await response.json()).id;
      }
      const response=await fetch("/api/subscriptions/orders/"+orderId.current+"/confirm",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({decision}),signal:AbortSignal.timeout(15000)});
      if(response.status===401){router.push("/login?next="+encodeURIComponent("/subscribe/"+program));return;}
      if(!response.ok)throw Error("payment");const result=await response.json();
      if(result.status==="PAID"){setReceipt(result);router.refresh();}
      else setError("Туршилтын төлбөр амжилтгүй. Сарын эрх өөрчлөгдөөгүй. Дахин оролдож болно.");
    }catch{setError("Баталгаажуулж чадсангүй. Дахин оролдоход энэ захиалгыг шалгана, давхар сар нэмэхгүй.");}
    finally{busy.current=false;setPending(false);}
  }
  if(receipt)return <div className="subscription-receipt"><span className="success-seal" aria-hidden="true">✓</span><h2>Сарын эрх нээгдлээ.</h2><p>Туршилтын төлбөр баталгаажлаа. Бодит мөнгө суутгаагүй.</p><dl><div><dt>Төлбөр</dt><dd>₮{receipt.amountMnt.toLocaleString("en-US")}</dd></div><div><dt>Хүчинтэй хүртэл</dt><dd>{formatBillingDate(receipt.periodEnd)}</dd></div><div><dt>Захиалга</dt><dd>{receipt.id}</dd></div></dl><Link className="button" href={"/programs/"+program}>Бэлтгэлээ эхлэх →</Link><Link className="text-link" href="/profile">Миний багцууд ↗</Link><button className="text-link renew-again" onClick={()=>{orderId.current=null;setReceipt(null);router.refresh();}}>Дахин нэг сар сунгах</button></div>;
  return <div className="subscription-payment"><div className="mock-payment-notice"><span className="status">ТУРШИЛТЫН ТӨЛБӨР</span><h2>Бодит мөнгө суутгахгүй.</h2><p>Карт, банкны мэдээлэл шаардахгүй. Нэг удаагийн баталгаажуулалтаар нэг календарь сар нээгдэнэ. Автоматаар сунгах, мөнгө суутгахгүй.</p></div><p className="subscription-renew-note">{renew?"Үлдсэн хугацаагаа алдахгүй. Одоогийн дуусах өдрөөс нэг сар нэмэгдэнэ.":"Баталгаажуулсан мөчөөс сарын хугацаа эхэлнэ."}</p>{error&&<p className="error-message" role="alert">{error}</p>}<button className="button checkout-pay" disabled={pending||!enabled} onClick={()=>pay("success")}>{pending?"Баталгаажуулж байна…":`${renew?"Нэг сар сунгах":"Сарын эрх нээх"} · ₮${amountMnt.toLocaleString("en-US")}`}</button><button className="text-link checkout-decline" disabled={pending||!enabled} onClick={()=>pay("decline")}>Амжилтгүй төлбөр турших</button>{!enabled&&<p className="error-message">Туршилтын төлбөр идэвхгүй байна.</p>}</div>;
}
