"use client";
import { useState } from "react";

export function EnglishPaperViewer({year,variant,pages,keyPages}:{year:number;variant:string;pages:string[];keyPages:string[]}){
 const [showKey,setShowKey]=useState(false);const [paperPage,setPaperPage]=useState(0);const [keyPage,setKeyPage]=useState(0);const [failed,setFailed]=useState(false);
 const images=showKey?keyPages:pages;const index=showKey?keyPage:paperPage;
 function selectPage(next:number){setFailed(false);if(showKey)setKeyPage(next);else setPaperPage(next);}
 function selectSection(next:boolean){setFailed(false);setShowKey(next);}
 return <section className="english-reader" aria-label="Шалгалтын материал">
  <div className="english-reader-toolbar"><div className="english-reader-sections"><button className="button secondary" aria-pressed={!showKey} onClick={()=>selectSection(false)}>Сэдэв</button><button className="button secondary" aria-pressed={showKey} onClick={()=>selectSection(true)}>Хариуны түлхүүр</button></div><div className="english-reader-pagination"><button className="admin-small-button" aria-label="Өмнөх хуудас" disabled={index===0} onClick={()=>selectPage(index-1)}>←</button><label>Хуудас <select aria-label="Материалын хуудас" value={index} onChange={event=>selectPage(Number(event.target.value))}>{images.map((url,i)=><option key={url} value={i}>{i+1} / {images.length}</option>)}</select></label><button className="admin-small-button" aria-label="Дараах хуудас" disabled={index===images.length-1} onClick={()=>selectPage(index+1)}>→</button></div></div>
  {showKey&&<p className="english-key-notice" role="status">{year} оны хариуны хүснэгт · Зөвхөн {variant} хувилбарын баганыг ашиглаарай.</p>}
  <div className="english-page">{failed?<div className="admin-empty" role="alert"><p>Хуудас ачаалагдсангүй.</p><a className="text-link" href={images[index]} target="_blank" rel="noreferrer">Хуудсыг тусдаа нээх ↗</a></div>:
   // Original archive pages, rendered as same-origin images for HTTPS and mobile readers.
   // eslint-disable-next-line @next/next/no-img-element
   <img key={images[index]} src={images[index]} alt={`${year} · Англи хэл · ${variant} · ${showKey?"Хариуны түлхүүр":"Сэдэв"} · ${index+1}-р хуудас`} onError={()=>setFailed(true)}/>}</div>
  <a className="text-link english-image-link" href={images[index]} target="_blank" rel="noreferrer">Энэ хуудсыг тусдаа нээх ↗</a>
 </section>;
}
