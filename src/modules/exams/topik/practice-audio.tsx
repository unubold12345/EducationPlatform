'use client';
import { QuestionPlayer } from '@/modules/exam-practice/listening-view';
import { audioPath, topikQuestionAudio } from '../audio-files';
import './topik.css';
/** Practice mode: the part's track, cut to this recording (its number and every reading), in the shared practice player. */
export function TopikPracticeAudio({slug,questionId,part}:{slug:string;questionId:string;part:number}){
 const range=topikQuestionAudio(slug,questionId);
 return <QuestionPlayer className="topik-practice-audio" src={`/api/exam-practice/${slug}${audioPath(slug)}?part=${part}`} start={range?.start} end={range?.end} label="Солонгос сонсох дадлага"/>;
}
