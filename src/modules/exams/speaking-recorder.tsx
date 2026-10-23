"use client";
import { useEffect,useRef,useState } from "react";
export function SpeakingRecorder({onComplete}:{onComplete:(blob:Blob)=>void}){
  const [error,setError]=useState(""),[recording,setRecording]=useState(false),[retry,setRetry]=useState(0);
  const callback=useRef(onComplete);
  useEffect(()=>{callback.current=onComplete;},[onComplete]);
  useEffect(()=>{
    let cancelled=false;let recorder:MediaRecorder|undefined;let stream:MediaStream|undefined;
    async function begin(){
      try{
        stream=await navigator.mediaDevices.getUserMedia({audio:true});
        if(cancelled){stream.getTracks().forEach(t=>t.stop());return;}
        const mime=["audio/webm;codecs=opus","audio/mp4","audio/ogg;codecs=opus"].find(type=>MediaRecorder.isTypeSupported(type));
        recorder=new MediaRecorder(stream,{...(mime?{mimeType:mime}:{}),audioBitsPerSecond:64000});
        const chunks:BlobPart[]=[];
        recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
        recorder.onstop=()=>{stream?.getTracks().forEach(t=>t.stop());if(chunks.length)callback.current(new Blob(chunks,{type:recorder!.mimeType}));};
        recorder.start(1000);setRecording(true);setError("");
      }catch{stream?.getTracks().forEach(t=>t.stop());if(!cancelled)setError("Микрофон бичиж чадахгүй байна. Эрх болон төхөөрөмжөө шалгаад дахин холбоно уу.");}
    }
    void begin();return()=>{cancelled=true;if(recorder&&recorder.state!=="inactive")recorder.stop();else stream?.getTracks().forEach(t=>t.stop());};
  },[retry]);
  return <div className="speaking-recorder">{error?<><p className="error-message" role="alert">{error}</p><button className="button secondary" onClick={()=>setRetry(r=>r+1)}>Микрофон дахин холбох</button></>:<><p role="status"><span className={recording?"recording-dot":""}/> {recording?"Яриа бичигдэж байна · Хэсэг дуусахад автоматаар хадгална":"Микрофон холбож байна…"}</p><p className="fine-print">Энэ хэсгийг дуустал хуудсыг шинэчлэхгүй, хаахгүй байлгаарай. Шинэчлэхэд одоо бичиж буй клип тасарна; цаг дахин эхлэхгүй.</p></>}</div>;
}
