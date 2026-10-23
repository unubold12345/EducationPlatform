"use client";
import { useEffect,useRef,useState } from "react";
export function ListeningPlayer({attemptId,elapsed}:{attemptId:string;elapsed:number}){
  const audio=useRef<HTMLAudioElement>(null),position=useRef(elapsed);
  useEffect(()=>{position.current=elapsed;},[elapsed]);
  const part=Math.min(4,Math.floor(elapsed/450)+1);
  const [blocked,setBlocked]=useState(false);
  async function resume(){
    if(!audio.current)return;
    try{audio.current.currentTime=position.current%450;await audio.current.play();setBlocked(false);}catch{setBlocked(true);}
  }
  useEffect(()=>{
    const element=audio.current;
    function sync(){if(element&&element.readyState>=1){const target=position.current%450;if(Math.abs(element.currentTime-target)>3)element.currentTime=target;}}
    const timer=setInterval(sync,2000);document.addEventListener("visibilitychange",sync);
    return()=>{clearInterval(timer);document.removeEventListener("visibilitychange",sync);element?.pause();};
  },[part]);
  return <section className="listening-player"><div><span className="audio-wave" aria-hidden="true">▂ ▅ ▃ ▇ ▄ ▂ ▆</span><strong>Listening · Part {part} / 4</strong></div><p>Нэг удаагийн бичлэг · Pause / Replay байхгүй · Refresh нь өнгөрсөн хугацаанаас үргэлжилнэ.</p><audio ref={audio} src={`/api/mock-attempts/${attemptId}/audio?part=${part}`} preload="auto" onLoadedMetadata={()=>void resume()} onError={()=>setBlocked(true)} aria-label={"Listening recording part "+part}/>{blocked?<button className="button secondary" onClick={()=>void resume()}>Дууг одоогийн байрлалаас холбох →</button>:null}</section>;
}
