// Speaking partners are voices, so they are shown as sound, not faces: each has a colour and a bar pattern of
// its own. Pure SVG with no hooks, so server pages (Workshop) can use it; avatar.tsx draws the live wave.
import type {CSSProperties} from "react";
import type {SpeakingVoice} from "./contracts";

/** The partner's colour: mid-tones that read on both the light and the dark card. */
export const partnerColor:Record<SpeakingVoice,string>={
 af_heart:"#4f6bed",af_bella:"#e07a5f",am_michael:"#2f8f7a",bf_emma:"#7a5cc9",bm_george:"#4d7ea8",bm_lewis:"#b5543c",
};

// Seven bar heights (0 to 1) per partner, so the marks differ by shape as well as colour.
const patterns:Record<SpeakingVoice,number[]>={
 af_heart:[.25,.6,.95,.5,.8,.4,.2],
 af_bella:[.45,.9,.35,.7,1,.55,.3],
 am_michael:[.2,.45,.7,1,.7,.45,.2],
 bf_emma:[.6,.3,.85,.45,.95,.3,.6],
 bm_george:[.3,.75,.5,.9,.5,.75,.3],
 bm_lewis:[.9,.5,.3,.65,.35,.8,.55],
};

// A wider strip for large art: the partner's pattern repeated under an envelope that swells in the middle.
function strip(pattern:number[],count:number):number[] {
 return Array.from({length:count},(_,i)=>{
  const centre=1-Math.abs(i-(count-1)/2)/((count-1)/2);
  return pattern[i%pattern.length]*(.25+.75*centre**.8);
 });
}

/** Static voice mark for pickers, cards and headings. --partner lets the page tint the circle behind it. */
export function PartnerMark({voice,className,label,wide=false}:{voice:SpeakingVoice;className?:string;label?:string;wide?:boolean}) {
 const heights=wide?strip(patterns[voice],19):patterns[voice],width=wide?360:200;
 const bar=wide?9:12,gap=wide?8:10,left=(width-heights.length*bar-(heights.length-1)*gap)/2;
 return <svg className={className} style={{"--partner":partnerColor[voice]} as CSSProperties} viewBox={`0 0 ${width} 200`} role={label?"img":undefined} aria-label={label} aria-hidden={label?undefined:true}>
  {heights.map((value,i)=>{
   const height=Math.max(bar,(wide?150:104)*value);
   return <rect key={i} x={left+i*(bar+gap)} y={100-height/2} width={bar} height={height} rx={bar/2} fill="var(--partner)" opacity={wide?.45+.55*value:1}/>;
  })}
 </svg>;
}
