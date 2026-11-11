'use client';
import { useRef } from 'react';
import { audioPath, hskQuestionAudio } from '../audio-files';
import './hsk.css';
/** Practice mode: the part's track, cued to this item (its number and both readings), replayable. */
export function HskPracticeAudio({slug,questionId,part}:{slug:string;questionId:string;part:number}){
 const audio=useRef<HTMLAudioElement>(null);
 const range=hskQuestionAudio(slug,questionId);
 const replay=async()=>{if(audio.current){audio.current.currentTime=range?.start??0;try{await audio.current.play();}catch{/* Native audio controls remain available. */}}};
 return <section className="hsk-practice-audio"><strong>听力 · Асуултын бичлэг</strong><audio key={questionId} ref={audio} controls preload="metadata" src={`/api/exam-practice/${slug}${audioPath(slug)}?part=${part}`} aria-label="Хятад сонсох дадлага" onLoadedMetadata={event=>{event.currentTarget.currentTime=range?.start??0;}} onTimeUpdate={event=>{if(range&&event.currentTarget.currentTime>=range.end+.1)event.currentTarget.pause();}}/><button className="button secondary small" type="button" onClick={()=>void replay()}>Энэ асуултыг дахин сонсох ↺</button><p className="fine-print">Хиймэл хятад дуу хоолой · Хоёр удаа уншина · Шалгасны дараа текст нээгдэнэ.</p></section>;
}
