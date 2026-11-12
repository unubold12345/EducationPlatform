"use client";
// Which of the Speaking Lab's partners is the AI examiner. Kept apart from the examiner itself so the start
// page can offer the choice without loading the voice, microphone and report code.
import "./speaking-examiner.css";
import {useSyncExternalStore} from "react";
import {speakingVoices,type SpeakingVoice} from "@/modules/speaking-lab/contracts";
import {PartnerMark} from "@/modules/speaking-lab/partner";
import {EXAMINER_VOICE} from "./speaking-examiner";
import {examinerVoice,setExaminerVoice,subscribeExaminer} from "./speaking-examiner-store";

/** The examiner chosen in this browser: George until the student picks another. */
export function useExaminerVoice():SpeakingVoice {
 return useSyncExternalStore(subscribeExaminer,examinerVoice,()=>EXAMINER_VOICE);
}

/** The six partners as a radio group. One choice covers every mock and practice session in this browser. */
export function ExaminerPicker() {
 const chosen=useExaminerVoice();
 return <div className="exam-examiner-pick" role="radiogroup" aria-label="AI шалгагч сонгох">
  {(Object.keys(speakingVoices) as SpeakingVoice[]).map(id=><button type="button" role="radio" key={id} aria-checked={chosen===id} aria-label={`${speakingVoices[id].label}, ${speakingVoices[id].accent}`} onClick={()=>setExaminerVoice(id)}>
   <PartnerMark voice={id}/><span>{speakingVoices[id].label}</span>
  </button>)}
 </div>;
}
