'use client';
import { useRef } from 'react';
import { jlptQuestionAudio } from '../audio-files';
import './jlpt.css';
export function JlptPracticeAudio({slug,questionId,part}:{slug:string;questionId:string;part:number}){
 const audio=useRef<HTMLAudioElement>(null);
 const range=jlptQuestionAudio(slug,questionId);
 const replay=async()=>{if(audio.current){audio.current.currentTime=range?.start??0;try{await audio.current.play();}catch{/* Native audio controls remain available. */}}};
 return <section className="jlpt-practice-audio"><strong>聴解 · Асуултын бичлэг</strong><audio key={questionId} ref={audio} controls preload="metadata" src={`/api/exam-practice/${slug}/audio?part=${part}`} aria-label="Япон Listening дадлага" onLoadedMetadata={event=>{event.currentTarget.currentTime=range?.start??0;}} onTimeUpdate={event=>{if(range&&event.currentTarget.currentTime>=range.end+.1)event.currentTarget.pause();}}/><button className="button secondary small" type="button" onClick={()=>void replay()}>Энэ асуултыг дахин сонсох ↺</button><p className="fine-print">Хиймэл япон дуу хоолой · Шалгасны дараа текст нээгдэнэ.</p></section>;
}
