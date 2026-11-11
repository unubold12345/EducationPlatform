"use client";
import {useEffect,useRef} from "react";
import type {EnergyRef} from "./audio";
import {speakingVoices,type SpeakingVoice} from "./contracts";
import {PartnerFigure,mouthShape,partnerLooks,type MouthPose} from "./partner";

export type AvatarMood="idle"|"listening"|"thinking"|"speaking";
export type AvatarGesture={name:"Wave"|"Yes"|"No"|"ThumbsUp";id:number}|null;

const motions={Wave:"wave",Yes:"nod",ThumbsUp:"nod",No:"shake"} as const;
type MouthPart=keyof ReturnType<typeof mouthShape>;
const mouthParts:[string,MouthPart][]=[[".sp-mouth-in","inner"],[".sp-teeth","teeth"],[".sp-tongue","tongue"],[".sp-lip-low","lower"],[".sp-lip-up","upper"],[".sp-dimples","dimples"],[".sp-lip-shine","shine"]];

// The partner is plain SVG: moods and gestures are CSS classes. The mouth is redrawn every frame from the
// voice level whenever any speech is playing, including short acknowledgements, and the ring around the
// portrait follows the same level. Between sentences the mouth eases back to the partner's own expression.
export function SpeakingAvatar({level,mood,gesture,voice}:{level:EnergyRef;mood:AvatarMood;gesture:AvatarGesture;voice:SpeakingVoice}) {
 const host=useRef<HTMLDivElement>(null),moodRef=useRef(mood);
 useEffect(()=>{moodRef.current=mood;},[mood]);
 // Gesture animations play once; a new gesture id remounts the drawing so the same one can replay.
 const motion=gesture?motions[gesture.name]:"wave";
 useEffect(()=>{
  const element=host.current;if(!element)return;
  const rest=partnerLooks[voice].rest,pose:MouthPose={...rest},drawn:MouthPose={open:-1,wide:0,smile:0};
  let frame=0,loud=0,shown=-1,quiet=99,talking=false,drawing:Element|null=null,parts:[Element[],MouthPart][]=[];
  const tick=(now:number)=>{
   loud+=(Math.min(1,level.current*6)-loud)*.35;
   if(Math.abs(loud-shown)>.004){shown=loud;element.style.setProperty("--voice",loud.toFixed(3));}
   // Keep the mouth open through the short gaps between words.
   quiet=level.current>.012?0:quiet+1;
   if((quiet<12)!==talking){talking=quiet<12;element.toggleAttribute("data-talking",talking);}
   // The page knows how loud the voice is, not which sound it is making, so while talking the lips wander
   // between stretched and rounded shapes; with the opening following the level this reads as speech.
   const feeling=moodRef.current;
   const target:MouthPose=talking?{open:Math.min(1,.1+loud*.95),wide:(Math.sin(now/173)*.55+Math.sin(now/97+1.3)*.45)*(.35+loud*.5),smile:.3}
    :feeling==="thinking"?{open:0,wide:-.35,smile:.2}
    :feeling==="listening"?{open:rest.open,wide:rest.wide+.15,smile:rest.smile+.2}:rest;
   const rate=talking?.42:.14;
   pose.open+=(target.open-pose.open)*rate;pose.wide+=(target.wide-pose.wide)*rate;pose.smile+=(target.smile-pose.smile)*rate;
   // A gesture remounts the drawing, so look the mouth up again whenever the element changes.
   if(element.firstElementChild!==drawing){
    drawing=element.firstElementChild;drawn.open=-1;
    parts=mouthParts.map(([selector,part])=>[[...element.querySelectorAll(selector)],part]);
   }
   if(Math.abs(pose.open-drawn.open)>.006||Math.abs(pose.wide-drawn.wide)>.012||Math.abs(pose.smile-drawn.smile)>.012){
    const paths=mouthShape(pose);
    for(const [nodes,part] of parts)for(const node of nodes)node.setAttribute("d",paths[part]);
    drawn.open=pose.open;drawn.wide=pose.wide;drawn.smile=pose.smile;
   }
   frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  return()=>cancelAnimationFrame(frame);
 },[level,voice]);
 return <div ref={host} className={`speaking-avatar mood-${mood} do-${motion}`} data-ready="true">
  <svg key={gesture?.id??0} viewBox="0 0 200 200" role="img" aria-label={`${speakingVoices[voice].label}, your AI speaking partner`}><PartnerFigure voice={voice}/></svg>
 </div>;
}
