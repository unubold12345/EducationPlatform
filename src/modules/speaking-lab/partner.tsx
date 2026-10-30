// Flat, hand-drawn speaking partners. Pure SVG with no hooks, so server pages (Workshop) can show
// the same faces; avatar.tsx adds blinking, talking and gestures through CSS classes and variables.
import type {SpeakingVoice} from "./contracts";

type Hair="bob"|"long"|"bun"|"short"|"side"|"crop";
type Look={skin:string;hair:string;top:string;style:Hair;glasses?:boolean;beard?:boolean};

export const partnerLooks:Record<SpeakingVoice,Look>={
 af_heart:{skin:"#e8b28c",hair:"#3a2620",top:"#4f6bed",style:"bob"},
 af_bella:{skin:"#f2c6a2",hair:"#8a3b22",top:"#e07a5f",style:"long"},
 am_michael:{skin:"#b57c57",hair:"#1d1715",top:"#2f8f7a",style:"short"},
 bf_emma:{skin:"#f3cfb0",hair:"#c79a4b",top:"#7a5cc9",style:"bun"},
 bm_george:{skin:"#e0aa85",hair:"#8f8b86",top:"#3d4a5c",style:"side",glasses:true},
 bm_lewis:{skin:"#8a5a3c",hair:"#221915",top:"#b5543c",style:"crop",beard:true},
};

const back:Partial<Record<Hair,string>>={
 bob:"M58 96C55 54 78 40 100 40s45 14 42 56l3 36c-9 7-21 7-28 1V102H83v31c-7 6-19 6-28-1Z",
 long:"M58 96C55 54 78 40 100 40s45 14 42 56l6 70c-14 8-28 6-34-2l-2-62H86l-2 62c-6 8-20 10-34 2Z",
};
const front:Record<Hair,string>={
 bob:"M64 92c-1-30 17-44 36-44 21 0 38 14 36 44-9-14-22-22-40-22-14 3-25 10-32 22Z",
 long:"M64 94c-2-31 16-46 36-46 22 0 38 16 36 46-6-17-20-25-34-25-4 9-16 15-38 25Z",
 bun:"M65 90c-1-27 15-40 35-40s37 13 35 40c-8-13-21-20-35-20s-27 7-35 20Z",
 short:"M65 88c-2-26 14-38 35-38 22 0 37 12 35 38-6-9-14-14-22-14-8 4-26 4-48 14Z",
 side:"M65 88c-2-26 14-38 35-38 22 0 37 12 35 38-4-10-11-17-20-19-14 6-34 9-50 19Z",
 crop:"M66 84c0-22 15-32 34-32s34 10 34 32c-10-8-22-11-34-11s-24 3-34 11Z",
};

export function PartnerFigure({voice}:{voice:SpeakingVoice}) {
 const look=partnerLooks[voice];
 return <g className="sp-figure">
  <path className="sp-body" d="M34 200c0-36 26-54 66-54s66 18 66 54Z" fill={look.top}/>
  <path d="M86 146h28l-14 16Z" fill="#ffffff" opacity=".85"/>
  <g className="sp-head">
   {back[look.style]&&<path d={back[look.style]} fill={look.hair}/>}
   {look.style==="bun"&&<circle cx="100" cy="40" r="15" fill={look.hair}/>}
   <rect x="89" y="118" width="22" height="30" rx="10" fill={look.skin}/>
   <rect x="89" y="128" width="22" height="8" fill="#000" opacity=".08"/>
   <ellipse cx="65" cy="98" rx="6" ry="9" fill={look.skin}/>
   <ellipse cx="135" cy="98" rx="6" ry="9" fill={look.skin}/>
   <ellipse cx="100" cy="94" rx="35" ry="40" fill={look.skin}/>
   {look.beard&&<path d="M66 100c2 26 16 36 34 36s32-10 34-36c-6 10-12 14-18 15-6-4-26-4-32 0-6-1-12-5-18-15Z" fill={look.hair}/>}
   <path d={front[look.style]} fill={look.hair}/>
   <g className="sp-brows" stroke={look.hair} strokeWidth="3.4" strokeLinecap="round" fill="none">
    <path d="M80 80q7-4 13 0"/><path d="M107 80q6-4 13 0"/>
   </g>
   <g className="sp-eyes" fill="#1f1a2e">
    <ellipse cx="86" cy="94" rx="3.6" ry="4.4"/><ellipse cx="114" cy="94" rx="3.6" ry="4.4"/>
   </g>
   {look.glasses&&<g stroke="#2b2b33" strokeWidth="2.2" fill="none"><rect x="75" y="86" width="22" height="16" rx="6"/><rect x="103" y="86" width="22" height="16" rx="6"/><path d="M97 93h6"/></g>}
   <ellipse cx="79" cy="107" rx="6" ry="3.5" fill="#e0606a" opacity=".16"/>
   <ellipse cx="121" cy="107" rx="6" ry="3.5" fill="#e0606a" opacity=".16"/>
   <path d="M100 97q-4 9 2 10" stroke="#000" strokeOpacity=".22" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
   <path className="sp-smile" d="M90 114q10 8 20 0" stroke="#7a3340" strokeWidth="3" fill="none" strokeLinecap="round"/>
   <ellipse className="sp-mouth" cx="100" cy="116" rx="7" ry="5.5" fill="#7a3340"/>
  </g>
  <g className="sp-hand"><path d="M150 200l8-46" stroke={look.top} strokeWidth="16" strokeLinecap="round"/><circle cx="160" cy="146" r="11" fill={look.skin}/></g>
 </g>;
}

// Static portrait for cards and pickers.
export function PartnerPortrait({voice,className,label}:{voice:SpeakingVoice;className?:string;label?:string}) {
 return <svg className={className} viewBox="0 0 200 200" role={label?"img":undefined} aria-label={label} aria-hidden={label?undefined:true}><PartnerFigure voice={voice}/></svg>;
}
