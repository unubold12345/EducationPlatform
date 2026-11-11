// Illustrated speaking partners. Each portrait is layered flat shapes with cel shading (dark and light
// overlays), so one drawing works for any skin, hair and clothing colour without gradients or ids.
// Pure SVG with no hooks, so server pages (Workshop) can show the same faces; avatar.tsx adds blinking,
// gaze and gestures through CSS classes and redraws the mouth from mouthShape() while the partner talks.
import type {CSSProperties,ReactNode} from "react";
import type {SpeakingVoice} from "./contracts";

type Hair="bob"|"long"|"bun"|"short"|"side"|"crop";
type Outfit="knit"|"scoop"|"henley"|"blouse"|"blazer"|"overshirt";
// open: 0 closed to 1 wide open. wide: -1 rounded ("oo") to 1 stretched ("ee"). smile: how far the corners lift.
export type MouthPose={open:number;wide:number;smile:number};
type Look={lines?:boolean;skin:string;hair:string;brow:string;top:string;iris:string;lip:string;style:Hair;outfit:Outfit;rest:MouthPose;strong?:boolean;lashes?:boolean;glasses?:boolean;beard?:boolean;freckles?:boolean;earrings?:string};

export const partnerLooks:Record<SpeakingVoice,Look>={
 af_heart:{skin:"#e3ab84",hair:"#3a2620",brow:"#2e1d18",top:"#4f6bed",iris:"#5b3a26",lip:"#c4605f",style:"bob",outfit:"knit",rest:{open:0,wide:.15,smile:1},lashes:true,earrings:"#e2b458"},
 af_bella:{skin:"#f4cfb2",hair:"#a5482a",brow:"#7c3620",top:"#e07a5f",iris:"#4f8a6a",lip:"#d8616b",style:"long",outfit:"scoop",rest:{open:.2,wide:.55,smile:1.25},lashes:true,freckles:true},
 am_michael:{skin:"#b47a55",hair:"#1d1715",brow:"#1d1715",top:"#2f8f7a",iris:"#3b2618",lip:"#96594b",style:"short",outfit:"henley",rest:{open:0,wide:0,smile:.8},strong:true},
 bf_emma:{skin:"#f5d3b8",hair:"#d2a653",brow:"#9c7636",top:"#7a5cc9",iris:"#4a7fb5",lip:"#cc5f72",style:"bun",outfit:"blouse",rest:{open:0,wide:.1,smile:.95},lashes:true,earrings:"#f6f2ea"},
 bm_george:{skin:"#e2ae8b",hair:"#9b9792",brow:"#6f6b67",top:"#3d4a5c",iris:"#5f7890",lip:"#b9736a",style:"side",outfit:"blazer",rest:{open:0,wide:0,smile:.6},strong:true,glasses:true,lines:true},
 bm_lewis:{skin:"#8a5a3c",hair:"#1f1714",brow:"#1f1714",top:"#b5543c",iris:"#2e1c12",lip:"#7c4638",style:"crop",outfit:"overshirt",rest:{open:.14,wide:.4,smile:1.1},strong:true,beard:true},
};

// ---------- Mouth ----------
const MX=100,MY=118;
const n=(value:number)=>+value.toFixed(2);
// Lips, opening, teeth and tongue as path data for one pose. Every curve runs corner to corner, so the
// closed mouth is the same drawing with an opening of zero height.
export function mouthShape({open,wide,smile}:MouthPose) {
 const w=10.2+wide*2.3,xl=n(MX-w),xr=n(MX+w),cy=n(MY-2.2*smile+open*.7);
 const top=MY-3.1-open*.5,line=MY+.3-open*.4,gap=open*8.5,floor=line+gap,base=floor+3.7-open*.5;
 // Control point that puts a corner-to-corner curve through height `mid` at the centre.
 const ctl=(mid:number)=>n(2*mid-cy);
 const lens=(a:number,b:number)=>`M${xl} ${cy}Q${MX} ${ctl(a)} ${xr} ${cy}Q${MX} ${ctl(b)} ${xl} ${cy}Z`;
 const teeth=Math.min(2.7,gap*.62),tongue=Math.max(0,Math.min(3.2,(gap-2.4)*.6));
 // The tongue lies on the middle 56% of the floor of the opening.
 const edge=cy+.3432*(ctl(floor)-cy),under=n(cy*.3432+ctl(floor)*.6568),tl=n(MX-w*.56),tr=n(MX+w*.56);
 return {
  upper:`M${xl} ${cy}Q${n(MX-w*.55)} ${n(top-.9)} ${MX-2.1} ${n(top-.5)}Q${MX} ${n(top+.9)} ${MX+2.1} ${n(top-.5)}Q${n(MX+w*.55)} ${n(top-.9)} ${xr} ${cy}Q${MX} ${ctl(line)} ${xl} ${cy}Z`,
  lower:lens(floor,base),inner:lens(line,floor),teeth:lens(line,line+teeth),
  tongue:`M${tl} ${n(edge)}Q${MX} ${under} ${tr} ${n(edge)}Q${MX} ${n(under-2*tongue)} ${tl} ${n(edge)}Z`,
  dimples:`M${n(xl-1.3)} ${n(cy-1.7)}q-.9 1.3-.2 2.5M${n(xr+1.3)} ${n(cy-1.7)}q.9 1.3 .2 2.5`,
  shine:`M${MX-3.2} ${n(floor+1.5)}Q${MX} ${n(floor+2.25)} ${MX+3.2} ${n(floor+1.5)}`,
 };
}

// ---------- Hair ----------
const hairBack:Partial<Record<Hair,string>>={
 bob:"M56 104c-5-44 13-68 44-68s49 24 44 68c-1 12 1 23 5 32-9 6-21 4-28-3H79c-7 7-19 9-28 3 4-9 6-20 5-32Z",
 long:"M55 104c-5-45 13-69 45-69s50 24 45 69c-1 16 2 32 7 50 1 8-3 13-10 15-8 2-16-1-22-6H80c-6 5-14 8-22 6-7-2-11-7-10-15 5-18 8-34 7-50Z",
};
const hairFront:Record<Hair,string>={
 bob:"M63.5 98c-4-34 12-55 36.5-55s40.5 21 36.5 55c-2-14-8-24-17-30-16 4-30 1-38-7-9 7-15 19-18 37Z",
 long:"M63 100c-5-36 12-57 37-57s42 21 37 57c-3-13-8-22-15-28-12 5-28 4-44-6-8 7-12 19-15 34Z",
 bun:"M65 92c-3-30 12-48 35-48s38 18 35 48c-4-13-9-21-17-26-14 3-27 1-36-5-8 6-13 16-17 31Z",
 short:"M66 88c-3-28 11-45 34-45s37 17 34 45c-2-9-5-15-9-19-17-3-33-3-50 0-4 4-7 10-9 19Z",
 side:"M66 90c-3-30 10-47 34-47 25 0 37 17 34 47-2-10-5-17-10-22-12 6-30 5-44-5-7 5-11 14-14 27Z",
 crop:"M67 86c-2-26 12-41 33-41s35 15 33 41c-2-8-5-13-9-17-16-3-32-3-48 0-4 4-7 9-9 17Z",
};
// A soft highlight following the crown.
const hairShine:Record<Hair,string>={
 bob:"M75 62c7-9 17-13 29-12",long:"M74 63c7-10 18-14 30-13",bun:"M78 58c7-6 15-8 24-8",
 short:"M79 56c7-5 14-7 22-7",side:"M84 57c8-6 17-8 27-6",crop:"M80 57c6-5 13-6 20-6",
};

const FACE_SOFT="M66 90c0-28 15-42 34-42s34 14 34 42c0 9-1 17-4 24-5 13-17 22-30 22s-25-9-30-22c-3-7-4-15-4-24Z";
const FACE_STRONG="M66 90c0-28 15-42 34-42s34 14 34 42c0 9-.6 16-2.6 23-3.6 14-15 23.4-31.4 23.4s-27.8-9.4-31.4-23.4c-2-7-2.6-14-2.6-23Z";
const TORSO="M18 200c1-23 13-37 38-43l31-9h26l31 9c25 6 37 20 38 43Z";
const INK="#241a22";

// Draws its children again mirrored left to right.
function Both({children}:{children:ReactNode}) {
 return <>{children}<g transform="matrix(-1 0 0 1 200 0)">{children}</g></>;
}

function Clothes({look}:{look:Look}) {
 const top=look.top;
 switch(look.outfit){
  case "knit":return <>
   <path d="M85.8 149c-.3 10.8 5.6 16.5 14.2 16.5s14.5-5.7 14.2-16.5" fill="none" stroke={top} strokeWidth="5.5"/>
   <path d="M85.8 149c-.3 10.8 5.6 16.5 14.2 16.5s14.5-5.7 14.2-16.5" fill="none" stroke="#fff" strokeOpacity=".2" strokeWidth="5.5" strokeDasharray="1 2"/>
   <path d="M83 150.5c.4 12 7 17.8 17 17.8s16.6-5.8 17-17.8" fill="none" stroke="#000" strokeOpacity=".12" strokeWidth="1.2"/>
  </>;
  case "scoop":return <>
   <path d="M80 150.5l7-2.5h26l7 2.5c0 13.5-8 20.5-20 20.5s-20-7-20-20.5Z" fill={look.skin}/>
   <path d="M80 150.5c0 13.5 8 20.5 20 20.5s20-7 20-20.5" fill="none" stroke="#000" strokeOpacity=".14" strokeWidth="1.4"/>
   <Both><path d="M87.5 158q5.5 2.4 10 1" fill="none" stroke="#000" strokeOpacity=".1" strokeWidth="1.2" strokeLinecap="round"/></Both>
   <path d="M88.5 150c1.6 8.5 5.9 12.9 11.5 12.9s9.9-4.4 11.5-12.9" fill="none" stroke="#d9a441" strokeWidth=".9"/>
   <circle cx="100" cy="164.4" r="2" fill="#d9a441"/>
  </>;
  case "henley":return <>
   <path d="M84 149c0 10 6.6 15 16 15s16-5 16-15" fill="none" stroke={top} strokeWidth="4.2"/>
   <path d="M84 149c0 10 6.6 15 16 15s16-5 16-15" fill="none" stroke="#000" strokeOpacity=".16" strokeWidth="4.2"/>
   <path d="M100 166v19" stroke="#000" strokeOpacity=".16" strokeWidth="1.3" strokeLinecap="round"/>
   <circle cx="103.4" cy="171" r="1.3" fill="#fff" opacity=".55"/><circle cx="103.4" cy="179" r="1.3" fill="#fff" opacity=".55"/>
  </>;
  case "blouse":return <>
   <path d="M87 148h26l-13 25Z" fill={look.skin}/>
   <path d="M87 148h26l-6 11.5c-4.5 2-9.5 2-14 0Z" fill="#000" opacity=".1"/>
   <Both><path d="M87.5 146.5l-7.5 4 10.5 21.5 9.5-10.5Z" fill={top}/><path d="M87.5 146.5l-7.5 4 10.5 21.5 9.5-10.5Z" fill="#fff" opacity=".3"/><path d="M80 150.5l10.5 21.5 9.5-10.5" fill="none" stroke="#000" strokeOpacity=".14" strokeWidth="1"/></Both>
   <path d="M100 173v27" stroke="#000" strokeOpacity=".13" strokeWidth="1.2"/>
   <circle cx="100" cy="181" r="1.4" fill="#fff" opacity=".6"/><circle cx="100" cy="191" r="1.4" fill="#fff" opacity=".6"/>
  </>;
  case "blazer":return <>
   <path d="M84 149.5l16 36.5 16-36.5-4-3H88Z" fill="#f3f4f7"/>
   <path d="M96.3 160.5h7.4l1.5 6-5.2 2.2-5.2-2.2Z" fill="#8c3b4a"/>
   <path d="M94.8 166.5l5.2 2.2 5.2-2.2 2.8 33.5H92Z" fill="#8c3b4a"/><path d="M100 168.7l5.2-2.2 2.8 33.5h-8Z" fill="#000" opacity=".13"/>
   <Both><path d="M88 146.5l12 13.5-7.5 9-9.5-18.5Z" fill="#fff"/><path d="M83 150.5l9.5 18.5 7.5-9" fill="none" stroke="#000" strokeOpacity=".16" strokeWidth="1"/>
    <path d="M83.5 150l-9.5 5.5 10.5 14-6 3.5 21.5 27V186Z" fill={top}/><path d="M83.5 150l-9.5 5.5 10.5 14-6 3.5 21.5 27V186Z" fill="#000" opacity=".2"/>
    <path d="M83.5 150l16.5 36v14" fill="none" stroke="#000" strokeOpacity=".2" strokeWidth="1"/></Both>
  </>;
  case "overshirt":return <>
   <path d="M84 146c0 7.4 7 11.8 16 11.8s16-4.4 16-11.8l8 5-6 49H82l-6-49Z" fill="#26262e"/>
   <path d="M85 148c.6 7 7 10.8 15 10.8s14.4-3.8 15-10.8" fill="none" stroke="#fff" strokeOpacity=".16" strokeWidth="2.2"/>
   <Both><path d="M86.5 146.5l-11 5.5 4.5 17 12.5-13.5Z" fill={top}/><path d="M86.5 146.5l-11 5.5 4.5 17 12.5-13.5Z" fill="#fff" opacity=".14"/>
    <path d="M75.5 152l4.5 17 12.5-13.5M80 169l3.5 31" fill="none" stroke="#000" strokeOpacity=".2" strokeWidth="1.1"/></Both>
  </>;
 }
}

export function PartnerFigure({voice}:{voice:SpeakingVoice}) {
 const look=partnerLooks[voice],mouth=mouthShape(look.rest),face=look.strong?FACE_STRONG:FACE_SOFT;
 const covered=look.style==="bob"||look.style==="long";
 const fade=look.style==="short"||look.style==="crop"||look.style==="side";
 return <g transform="translate(-13 -23) scale(1.13)"><g className="sp-figure">
  <g className="sp-body">
   <path d={TORSO} fill={look.top}/>
   <path d="M144 157c25 6 37 20 38 43h-24c0-17-4-31-14-43Z" fill="#000" opacity=".1"/>
   <path d="M56 157c-13 3.2-23 8.6-29.5 16.4 8-6.4 18-10.6 31.5-13.2Z" fill="#fff" opacity=".16"/>
   <Both><path d="M45 200c0-12 2-21 6-29" fill="none" stroke="#000" strokeOpacity=".13" strokeWidth="1.5" strokeLinecap="round"/></Both>
  </g>
  <g className="sp-head">
   {hairBack[look.style]&&<path d={hairBack[look.style]} fill={look.hair}/>}
   {hairBack[look.style]&&<path d={hairBack[look.style]} fill="#000" opacity=".16"/>}
   {look.style==="bun"&&<><circle cx="100" cy="36.5" r="13" fill={look.hair}/><path d="M90 32c4-4.5 10-6 16.5-3.5" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="2.4" strokeLinecap="round"/><path d="M89 44c7 3.6 15 3.6 22 0" fill="none" stroke="#000" strokeOpacity=".2" strokeWidth="1.6" strokeLinecap="round"/></>}
   <path d={look.strong?"M86 116h28v30c0 8-6 13-14 13s-14-5-14-13Z":"M88.5 116h23v30c0 8-5 13-11.5 13s-11.5-5-11.5-13Z"} fill={look.skin}/>
   <path d={look.strong?"M86 116h28v19c-8.6 7.5-19.4 7.5-28 0Z":"M88.5 116h23v19c-7 7.5-16 7.5-23 0Z"} fill="#000" opacity=".16"/>
   <Clothes look={look}/>
   {!covered&&<Both><ellipse cx="65.5" cy="96" rx="5.3" ry="8.6" fill={look.skin}/><ellipse cx="65.5" cy="96" rx="5.3" ry="8.6" fill="#000" opacity=".07"/><path d="M64.2 91.5q-2.3 4.2 .2 8.8" fill="none" stroke="#000" strokeOpacity=".2" strokeWidth="1.2" strokeLinecap="round"/></Both>}
   {look.earrings&&!covered&&<Both><circle cx="64.8" cy="106.8" r="2.3" fill={look.earrings}/><circle cx="64.2" cy="106.2" r=".8" fill="#fff" opacity=".7"/></Both>}
   <path d={face} fill={look.skin}/>
   <path d="M134 90c0 9-1 17-4 24-5 13-17 22-30 22 13.5-5 23-18 25.5-34 .8-5 1.5-9 1.5-13Z" fill="#000" opacity=".07"/>
   <path d="M72 84c1-13 7-22 16-27-6 7-9 16-9.5 27Z" fill="#fff" opacity=".1"/>
   {fade&&<Both><path d="M66 90c0 5 .3 8.5 1 11.5l3-.7c-.8-9 .7-18 6-30.8-5 4-8 11-10 20Z" fill={look.hair} opacity=".6"/></Both>}
   {look.beard&&<><path d="M67 97c.8 8 2.4 14.5 4.6 19.5 4.4 12.5 14.9 20.2 28.4 20.2s24-7.7 28.4-20.2c2.2-5 3.8-11.5 4.6-19.5-2.4 7.5-6 12.5-11.5 15-3.5-2.8-8-3.9-13-3.9h-17c-5 0-9.5 1.1-13 3.9-5.5-2.5-9.1-7.5-11.5-15Z" fill={look.hair}/><path d="M86 127c4.5 3 9 4 14 4s9.5-1 14-4c-3 5.5-8 8.5-14 8.5s-11-3-14-8.5Z" fill="#fff" opacity=".07"/></>}
   <path d={hairFront[look.style]} fill="#000" opacity=".14" transform="translate(0 2.4)"/>
   <path d={hairFront[look.style]} fill={look.hair}/>
   <path d={hairShine[look.style]} fill="none" stroke="#fff" strokeOpacity={look.style==="crop"||look.style==="short"?".1":".2"} strokeWidth="3" strokeLinecap="round"/>
   {look.style==="side"&&<path d="M81 63c2-7 6-12 12-15.5" fill="none" stroke="#000" strokeOpacity=".2" strokeWidth="1.3" strokeLinecap="round"/>}
   <g className="sp-brows" stroke={look.brow} strokeWidth={look.strong?"3.2":"2.3"} strokeLinecap="round" fill="none">
    <path className="sp-brow-l" d="M78.4 85.2q5.4-5 14.6-2.4"/><path className="sp-brow-r" d="M121.6 85.2q-5.4-5-14.6-2.4"/>
   </g>
   <g className="sp-eyes">
    <Both><path d="M80 88.3q6-4.2 12 0" fill="none" stroke="#000" strokeOpacity=".14" strokeWidth="1" strokeLinecap="round"/></Both>
    <g className="sp-eye-open">
     <Both><path d="M79 93.4q7-9.2 14 0q-7 6.6-14 0Z" fill="#fff"/><path d="M79 93.4q7-9.2 14 0q-7-3.4-14 0Z" fill="#000" opacity=".1"/></Both>
     <g className="sp-iris">
      {[86,114].map(cx=><g key={cx}><circle cx={cx} cy="92.5" r="3.6" fill={look.iris}/><circle cx={cx} cy="92.5" r="3.6" fill="none" stroke="#000" strokeOpacity=".28" strokeWidth=".7"/><circle cx={cx} cy="92.5" r="1.8" fill="#150f14"/><circle cx={cx+1.2} cy="91.3" r="1.05" fill="#fff"/><circle cx={cx-1.3} cy="93.9" r=".5" fill="#fff" opacity=".6"/></g>)}
     </g>
     <Both><path d="M78.6 93.6q7.4-9.8 14.8 0" fill="none" stroke={INK} strokeWidth={look.lashes?"1.8":"1.5"} strokeLinecap="round"/>{look.lashes&&<path d="M78.9 93.3q-1.6-.6-3-2.3" fill="none" stroke={INK} strokeWidth="1.3" strokeLinecap="round"/>}<path d="M81.5 96.6q4.5 1.3 9 0" fill="none" stroke="#000" strokeOpacity=".13" strokeWidth=".9" strokeLinecap="round"/></Both>
    </g>
    <g className="sp-eye-shut" opacity="0"><Both><path d="M79.2 93q6.8 4.4 13.6 0" fill="none" stroke={INK} strokeWidth="1.9" strokeLinecap="round"/></Both></g>
   </g>
   {look.glasses&&<g stroke="#2b2b33" strokeWidth="1.9" fill="none" strokeLinecap="round"><Both><rect x="76.2" y="87" width="19.6" height="15" rx="6.4" fill="#fff" fillOpacity=".12"/><path d="M76.2 91.5l-9.7-2.3"/></Both><path d="M95.8 92.6q4.2-2.6 8.4 0"/></g>}
   <Both><ellipse cx="78" cy="106.5" rx="6.5" ry="3.8" fill="#e2566a" opacity=".16"/></Both>
   {look.freckles&&<Both><g fill="#9a5a34" opacity=".35"><circle cx="76" cy="103" r=".7"/><circle cx="79.5" cy="104.6" r=".7"/><circle cx="82.5" cy="102.6" r=".7"/><circle cx="92" cy="103.5" r=".6"/></g></Both>}
   <path d="M98.6 97.5q-3.2 8-2.4 10.2q2.6 2.6 6.4 .9" fill="none" stroke="#000" strokeOpacity=".2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
   <path d="M101.3 98.5q.9 3.5 .5 6" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="1.4" strokeLinecap="round"/>
   {look.lines&&<><Both><path d="M90.5 107.5q-3.6 4-3.4 8.5" fill="none" stroke="#000" strokeOpacity=".13" strokeWidth="1.1" strokeLinecap="round"/></Both><path d="M88 71.5q12-2.2 24 0" fill="none" stroke="#000" strokeOpacity=".08" strokeWidth="1" strokeLinecap="round"/></>}
   <g className="sp-mouth">
    <path className="sp-mouth-in" d={mouth.inner} fill="#4a1622"/>
    <path className="sp-teeth" d={mouth.teeth} fill="#fff"/>
    <path className="sp-tongue" d={mouth.tongue} fill="#d9697a"/>
    <path className="sp-lip-low" d={mouth.lower} fill={look.lip}/>
    <path className="sp-lip-low" d={mouth.lower} fill="#fff" opacity=".1"/>
    <path className="sp-lip-up" d={mouth.upper} fill={look.lip}/>
    <path className="sp-lip-up" d={mouth.upper} fill="#000" opacity=".13"/>
    <path className="sp-dimples" d={mouth.dimples} fill="none" stroke="#000" strokeOpacity=".11" strokeWidth=".9" strokeLinecap="round"/>
    <path className="sp-lip-shine" d={mouth.shine} fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth=".9" strokeLinecap="round"/>
   </g>
  </g>
  <g className="sp-hand" opacity="0">
   <path d="M152 206l7-44" stroke={look.top} strokeWidth="17" strokeLinecap="round"/>
   <path d="M152 206l7-44" stroke="#000" strokeOpacity=".1" strokeWidth="17" strokeLinecap="round"/>
   <g fill={look.skin}>
    <rect x="149.5" y="136" width="21" height="23" rx="9.5"/>
    <rect x="150" y="121" width="5" height="22" rx="2.5" transform="rotate(-8 152.5 143)"/><rect x="155.6" y="117.5" width="5" height="25" rx="2.5" transform="rotate(-2 158 143)"/>
    <rect x="161.2" y="118.5" width="5" height="24" rx="2.5" transform="rotate(4 163.7 143)"/><rect x="166.6" y="123" width="4.6" height="20" rx="2.3" transform="rotate(10 169 143)"/>
    <rect x="141" y="140" width="13" height="5.6" rx="2.8" transform="rotate(28 152 143)"/>
   </g>
   <path d="M154 150q5.5 3.5 12 .5" fill="none" stroke="#000" strokeOpacity=".14" strokeWidth="1.1" strokeLinecap="round"/>
  </g>
 </g></g>;
}

// Static portrait for cards and pickers. --partner lets the page tint the circle behind each face.
export function PartnerPortrait({voice,className,label}:{voice:SpeakingVoice;className?:string;label?:string}) {
 return <svg className={className} style={{"--partner":partnerLooks[voice].top} as CSSProperties} viewBox="0 0 200 200" role={label?"img":undefined} aria-label={label} aria-hidden={label?undefined:true}><PartnerFigure voice={voice}/></svg>;
}
