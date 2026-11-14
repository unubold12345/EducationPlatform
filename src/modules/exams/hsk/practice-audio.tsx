'use client';
import { QuestionPlayer } from '@/modules/exam-practice/listening-view';
import { audioPath, hskQuestionAudio } from '../audio-files';
import './hsk.css';
/** Practice mode: the part's track, cut to this item (its number and both readings), in the same player as IELTS practice. */
export function HskPracticeAudio({slug,questionId,part}:{slug:string;questionId:string;part:number}){
 const range=hskQuestionAudio(slug,questionId);
 return <QuestionPlayer className="hsk-practice-audio" src={`/api/exam-practice/${slug}${audioPath(slug)}?part=${part}`} start={range?.start} end={range?.end} label="Хятад сонсох дадлага"/>;
}
