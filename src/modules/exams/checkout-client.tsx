"use client";
import { useRef,useState } from "react";
import { useRouter } from "next/navigation";
import { MOCK_PRICE_LABEL } from "./pricing";

export function MockCheckout({slug,declined=false,enabled}:{slug:string;declined?:boolean;enabled:boolean}) {
  const router=useRouter(); const busy=useRef(false);
  const [pending,setPending]=useState(false),[error,setError]=useState(""),[failed,setFailed]=useState(declined);
  async function pay(decision:"success"|"decline") {
    if (busy.current) return; busy.current=true; setPending(true); setError("");
    try {
      const created=await fetch("/api/mock-payments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({slug}),signal:AbortSignal.timeout(15000)});
      if(created.status===401){router.push("/login?next="+encodeURIComponent("/checkout/"+slug));return;}
      if(!created.ok)throw Error("order"); const order=await created.json();
      const confirmed=await fetch("/api/mock-payments/"+order.id+"/confirm",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({decision}),signal:AbortSignal.timeout(15000)});
      if(!confirmed.ok)throw Error("payment"); const result=await confirmed.json();
      if(result.status==="PAID"){setFailed(false);router.refresh();}
      else {setFailed(true);}
    } catch {setError("Төлбөр баталгаажсангүй. Холболтоо шалгаад дахин оролдоно уу. Давхар эрх үүсэхгүй.");}
    finally{busy.current=false;setPending(false);}
  }
  return <div className="mock-checkout-actions">
    <div className="mock-payment-notice"><span className="status">ТУРШИЛТЫН ТӨЛБӨР</span><h2>Бодит мөнгө суутгахгүй.</h2><p>Энэ нь төлбөрийн туршилтын загвар. Картын мэдээлэл, банкны шилжүүлэг шаардлагагүй. Баталгаажуулснаар зөвхөн энэ mock шалгалтын эрх нээгдэнэ.</p></div>
    {failed && <p className="error-message" role="alert">Туршилтын төлбөр амжилтгүй. Эрх нээгдээгүй. Дахин оролдож болно.</p>}
    {error && <p className="error-message" role="alert">{error}</p>}
    {!enabled && <p className="error-message" role="alert">Туршилтын төлбөр энэ орчинд идэвхгүй байна.</p>}
    <button className="button checkout-pay" disabled={pending||!enabled} onClick={()=>pay("success")}>{pending?"Баталгаажуулж байна…":`Туршилтаар төлөх · ${MOCK_PRICE_LABEL}`}</button>
    <button className="text-link checkout-decline" disabled={pending||!enabled} onClick={()=>pay("decline")}>Амжилтгүй төлбөр турших</button>
    <p className="fine-print">Нэг удаагийн эрх · Энэ шалгалтыг дахин өгч болно · Нөгөө шалгалт тусдаа эрхтэй</p>
  </div>;
}
