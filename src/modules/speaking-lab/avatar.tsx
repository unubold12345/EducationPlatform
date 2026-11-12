"use client";
import {useEffect,useRef} from "react";
import type {EnergyRef} from "./audio";
import {speakingVoices,type SpeakingVoice} from "./contracts";

export type AvatarMood="idle"|"listening"|"thinking"|"speaking";
export type AvatarGesture={name:"Wave"|"Yes"|"No"|"ThumbsUp";id:number}|null;

const STEP=55,SAMPLES=96;
const reach=(value:number)=>Math.max(0,Math.min(1,value));

// The partner on stage is a live voice wave, not a face. Loudness enters at the centre and travels outwards
// on both sides, so the strip is a short history of the conversation: the partner's colour while it speaks,
// green while the student speaks (from the stage's --level), quiet moments as a row of dots. Thinking is a
// ripple, and a gesture (the nod after an answer, the greeting) is a small pulse.
export function SpeakingAvatar({level,mood,gesture,voice}:{level:EnergyRef;mood:AvatarMood;gesture:AvatarGesture;voice:SpeakingVoice}) {
 const host=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null),moodRef=useRef(mood),pulse=useRef(0);
 useEffect(()=>{moodRef.current=mood;},[mood]);
 useEffect(()=>{if(gesture)pulse.current=gesture.name==="Wave"?4:2;},[gesture]);
 useEffect(()=>{
  const element=host.current,surface=canvas.current,context=surface?.getContext("2d");
  if(!element||!surface||!context)return;
  const stage=element.closest<HTMLElement>(".sl-stage"),inks=element.querySelectorAll<HTMLElement>("i");
  const still=matchMedia("(prefers-reduced-motion: reduce)").matches;
  // history[0] is the newest sample; student[i] marks samples heard from the microphone.
  const history=new Float32Array(SAMPLES),student=new Uint8Array(SAMPLES);
  let frame=0,last=performance.now(),carry=0,peak=0,centre=0,width=0,height=0,inked=-1e9,partnerInk="#4f6bed",studentInk="#1f9d6b";
  const size=()=>{
   const box=element.getBoundingClientRect(),ratio=Math.min(window.devicePixelRatio||1,2);
   width=box.width;height=box.height;
   surface.width=Math.max(1,Math.round(width*ratio));surface.height=Math.max(1,Math.round(height*ratio));
   context.setTransform(ratio,0,0,ratio,0,0);
  };
  const observer=new ResizeObserver(size);observer.observe(element);size();
  const pill=(x:number,tall:number,thick:number)=>{context.beginPath();context.roundRect(x-thick/2,height/2-tall/2,thick,tall,thick/2);context.fill();};
  const tick=(now:number)=>{
   const feeling=moodRef.current,listening=feeling==="listening";
   const live=listening?reach(Number(stage?.style.getPropertyValue("--level"))||0):reach(level.current*6);
   peak=Math.max(peak,live);centre+=(live-centre)*.4;
   // A hidden tab pauses the frames; do not replay the whole gap as silence.
   carry=Math.min(carry+now-last,STEP*4);last=now;
   while(carry>=STEP){
    carry-=STEP;history.copyWithin(1,0);student.copyWithin(1,0);
    history[0]=pulse.current>0?Math.max(peak,.5):peak;student[0]=listening?1:0;
    if(pulse.current>0)pulse.current--;
    peak=0;
   }
   // The colours come from CSS (theme and partner), re-read now and then so a theme switch is picked up.
   if(now-inked>500){inked=now;partnerInk=getComputedStyle(inks[0]).color;studentInk=getComputedStyle(inks[1]).color;}
   context.clearRect(0,0,width,height);
   const pitch=width<340?8:10,thick=pitch*.46,half=width/2,slide=still?0:carry/STEP;
   const draw=(distance:number,value:number,mine:boolean)=>{
    const near=1-distance/half;if(near<=0)return;
    // At rest the strip is a line of dots: a slow shimmer when idle, a ripple running outwards while thinking.
    const rest=still?0:feeling==="thinking"?.11+.09*Math.sin(now/210-distance/22):.045+.04*Math.sin(now/800-distance/34);
    const amount=Math.max(value,rest),loud=amount>.09;
    const tall=Math.max(thick,amount*height*.9*(.3+.7*near**.7));
    const shimmer=still||loud?1:.7+.3*Math.sin(now/950-distance/46);
    context.globalAlpha=(.2+.8*near**1.1)*(loud?1:.7)*shimmer;
    context.fillStyle=mine?studentInk:partnerInk;
    context.shadowColor=context.fillStyle;context.shadowBlur=loud?14*amount:0;
    pill(half+distance,tall,thick);
    if(distance>.5)pill(half-distance,tall,thick);
   };
   draw(0,centre,listening);
   for(let i=0;i<SAMPLES;i++){
    const distance=(i+slide)*pitch;if(distance>half)break;
    draw(distance,history[i],student[i]===1);
   }
   context.globalAlpha=1;context.shadowBlur=0;
   frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  return()=>{cancelAnimationFrame(frame);observer.disconnect();};
 },[level]);
 return <div ref={host} className={`speaking-avatar mood-${mood}`} data-ready="true" role="img" aria-label={`${speakingVoices[voice].label}, your AI speaking partner`}>
  <canvas ref={canvas} aria-hidden="true"/><i className="sw-partner" aria-hidden="true"/><i className="sw-student" aria-hidden="true"/>
 </div>;
}
