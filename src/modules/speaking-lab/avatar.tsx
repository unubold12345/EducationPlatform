"use client";
import {useEffect,useRef} from "react";
import type {EnergyRef} from "./audio";
import {speakingVoices,type SpeakingVoice} from "./contracts";
import {PartnerFigure} from "./partner";

export type AvatarMood="idle"|"listening"|"thinking"|"speaking";
export type AvatarGesture={name:"Wave"|"Yes"|"No"|"ThumbsUp";id:number}|null;

const motions={Wave:"wave",Yes:"nod",ThumbsUp:"nod",No:"shake"} as const;

// The partner is plain SVG: moods and gestures are CSS classes, and the mouth follows the voice level.
export function SpeakingAvatar({level,mood,gesture,voice}:{level:EnergyRef;mood:AvatarMood;gesture:AvatarGesture;voice:SpeakingVoice}) {
 const host=useRef<HTMLDivElement>(null);
 // Gesture animations play once; a new gesture id remounts the drawing so the same one can replay.
 const motion=gesture?motions[gesture.name]:"wave";
 useEffect(()=>{
  const element=host.current;if(!element||mood!=="speaking")return;
  let frame=0,mouth=.2;
  const tick=()=>{mouth+=(Math.min(1,.2+level.current*6)-mouth)*.35;element.style.setProperty("--mouth",mouth.toFixed(3));frame=requestAnimationFrame(tick);};
  tick();
  return()=>{cancelAnimationFrame(frame);element.style.removeProperty("--mouth");};
 },[mood,level]);
 return <div ref={host} className={`speaking-avatar mood-${mood} do-${motion}`} data-ready="true">
  <svg key={gesture?.id??0} viewBox="0 0 200 200" role="img" aria-label={`${speakingVoices[voice].label}, your AI speaking partner`}><PartnerFigure voice={voice}/></svg>
 </div>;
}
