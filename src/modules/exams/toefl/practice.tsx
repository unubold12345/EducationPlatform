'use client';
import type { PracticeQuestion } from '@/modules/exam-practice/types';
import { BuildTask, GapInput, ToeflText, ToeflWritingTask } from './view';
import './toefl.css';

/** A TOEFL item in practice mode: its page (paragraph, text, recording or task) and the gap or Build a Sentence answer. Choices and text answers use the shared controls. */
export function ToeflPracticeItem({question,value,disabled,base,onChange}:{question:PracticeQuestion;value:string;disabled:boolean;base:string;onChange:(value:string)=>void}){
 const group=question.toeflGroup;
 const clip=question.toefl?.clip??(group&&'clip' in group?group.clip:undefined);
 return <div className="toefl-practice">
  {clip?<section className="listening-player practice-audio toefl-practice-audio"><p lang="en">{group?.layout==='set'?group.setting:group?.layout==='response'?'Listen to the speaker. Choose the best response.':group?.layout==='speaking-intro'?group.scenario:question.kind==='speaking'?(question.prompt??''):''}</p><audio key={clip} controls preload="none" src={`${base}/audio/toefl?clip=${encodeURIComponent(clip)}`} aria-label="Recording"/></section>:null}
  {group?.layout==='words'?<div className="toefl-words" lang="en"><p>{group.segments.map((part,at)=>typeof part==='string'?<span key={at}>{part}</span>
   :part.q===question.id&&question.toefl?.gap?<GapInput key={at} id={'practice-gap'} gap={question.toefl.gap} value={value} disabled={disabled} label={'Асуулт '+question.label} onChange={onChange}/>
   :<span key={at} className="toefl-gap-other">{part.prefix}{'_'.repeat(part.missing??0)}</span>)}</p></div>:null}
  {group?.layout==='daily'||group?.layout==='academic'?<ToeflText group={group}/>:null}
  {group?.layout==='email'||group?.layout==='discussion'?<ToeflWritingTask group={group}/>:null}
  {question.toefl?.build?<BuildTask key={question.id} build={question.toefl.build} number={question.label} value={value} disabled={disabled} onChange={onChange}/>:null}
 </div>;
}
