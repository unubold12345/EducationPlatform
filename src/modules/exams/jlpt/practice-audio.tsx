'use client';
import { QuestionPlayer } from '@/modules/exam-practice/listening-view';
import { jlptQuestionAudio } from '../audio-files';
import './jlpt.css';
/** Practice mode: the part's track, cut to this question, in the same player as IELTS practice. */
export function JlptPracticeAudio({slug,questionId,part}:{slug:string;questionId:string;part:number}){
 const range=jlptQuestionAudio(slug,questionId);
 return <QuestionPlayer className="jlpt-practice-audio" src={`/api/exam-practice/${slug}/audio?part=${part}`} start={range?.start} end={range?.end} label="Япон Listening дадлага"/>;
}
