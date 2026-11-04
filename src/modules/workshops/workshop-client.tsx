"use client";
import { useState } from "react";

export function WorkshopClient({ title, minWords, checklist }: { title: string; minWords: number; checklist: string[] }) {
  const [text, setText] = useState("");
  const [review, setReview] = useState(false);
  const count = text.trim() ? text.trim().split(/\s+/u).length : 0;
  function download() {
    const url = URL.createObjectURL(new Blob([title + "\n\n" + text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = "ielts-practice.txt"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="workshop-response"><label htmlFor="workshop-answer">{minWords ? "Өөрийн хариуг бичээрэй" : "Төлөвлөгөө / хариуны буулгалт"}</label>
    <textarea id="workshop-answer" lang="en" rows={14} maxLength={16000} value={text} onChange={event => setText(event.target.value)} placeholder="Write your own response here…" />
    <p className="fine-print" role="status">{count} үг{minWords ? " · Зорилго: " + minWords + "+ үг" : ""}</p>
    <p className="fine-print">Хариулт энэ хуудсанд түр байна. Хаах эсвэл шинэчлэхээсээ өмнө татаж аваарай. Автомат band оноо өгөхгүй.</p>
    <div className="result-actions"><button className="button" onClick={() => setReview(true)}>Өөрийгөө шалгах →</button><button className="button secondary" disabled={!text.trim()} onClick={download}>Хариугаа татах ↓</button></div>
    {review ? <fieldset className="self-review"><legend>Өөрийн хариутай харьцуулж тэмдэглээрэй</legend>{checklist.map(item => <label key={item}><input type="checkbox" />{item}</label>)}<p className="fine-print">Сонголтууд нь таны өөрийн үнэлгээ. Нарийн үнэлгээ авахын тулд багшаар хянуулаарай.</p></fieldset> : null}
  </section>;
}
