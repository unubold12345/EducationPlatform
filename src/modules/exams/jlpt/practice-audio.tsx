'use client';
import { QuestionPlayer } from '@/modules/exam-practice/listening-view';
import { audioPath, jlptQuestionAudio } from '../audio-files';
import './jlpt.css';
/** Practice mode: the part's track, cut to this question, in the same player as IELTS practice. */
export function JlptPracticeAudio({slug,questionId,part,revision=1}:{slug:string;questionId:string;part:number;revision?:number}){
 const range=jlptQuestionAudio(slug,questionId,revision);
 return <QuestionPlayer className="jlpt-practice-audio" src={`/api/exam-practice/${slug}${audioPath(slug,revision)}?part=${part}`} start={range?.start} end={range?.end} label="Япон Listening дадлага"/>;
}
