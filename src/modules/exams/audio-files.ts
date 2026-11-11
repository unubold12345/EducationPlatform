import revisedData from "./ielts-audio-v2.json" with { type: "json" };
const revisedAudio=revisedData as Record<string,{prefix:string;seconds:number[]}>;
import formsData from "./ielts-forms-audio.json" with { type: "json" };
// Mocks 07–12 (scripts/build-ielts-mocks.mjs) have one recording set each, so no audio revision applies.
const formsAudio=Object.values(formsData as Record<string,{prefix:string;seconds:number[]}>);
import jlptData from './jlpt/audio-catalog.json' with { type: 'json' };
import hskData from './hsk/audio-catalog.json' with { type: 'json' };
type ItemTimings=Record<string,{seconds:number[];questions:Record<string,{start:number;end:number;part:number}>}>;
const jlptAudio = jlptData as ItemTimings;
// HSK 1 (scripts/generate-hsk-audio.py): four part tracks per mock in assets/hsk-audio, each item read twice.
const hskAudio = hskData as ItemTimings;
/**
 * Which audio route serves a mock. Each route bundles one recording folder into its server function, which must
 * stay under Vercel's 250 MB: `…/audio` serves assets/exams (IELTS 01–06, JLPT), `…/audio/forms` serves
 * assets/ielts-forms (IELTS 07–12) and `…/audio/hsk` serves assets/hsk-audio (HSK 1). A new recording set should
 * get its own folder and route segment.
 */
export type AudioSet="base"|"forms"|"hsk";
export const audioSetOf=(slug:string):AudioSet=>Object.hasOwn(formsData,slug)?"forms":Object.hasOwn(hskAudio,slug)?"hsk":"base";
export const audioPath=(slug:string)=>({base:"/audio",forms:"/audio/forms",hsk:"/audio/hsk"} as const)[audioSetOf(slug)];
export function jlptQuestionAudio(slug:string,id:string) { return Object.hasOwn(jlptAudio,slug)?jlptAudio[slug].questions[id]:undefined; }
/** Where one HSK item (its number and both readings) sits in its part's track, for practice replay. */
export function hskQuestionAudio(slug:string,id:string) { return Object.hasOwn(hskAudio,slug)&&Object.hasOwn(hskAudio[slug].questions,id)?hskAudio[slug].questions[id]:undefined; }
const listeningFiles:Record<string,string>={
  "ielts-academic-01":"ielts-01",
  "ielts-academic-02":"ielts-02",
  "ielts-academic-03":"ielts-03",
  "ielts-academic-04":"ielts-04",
  "ielts-academic-05":"ielts-05",
  "ielts-academic-06":"ielts-06",
  ...Object.fromEntries(Object.entries(formsData).map(([slug,audio])=>[slug,audio.prefix])),
};
// Recorded length of parts 1–4 in seconds (assets/exams/manifest*.json). Every part uses one speaking pace,
// so lengths differ; parts play back to back and any time left in the stage follows the last part.
const listeningSeconds:Record<string,readonly number[]>={
  "ielts-01":[432.84,295.74,349.69,438.60],
  "ielts-02":[285.96,301.92,348.31,301.30],
  "ielts-03":[280.48,298.25,356.17,293.96],
  "ielts-04":[278.96,298.44,346.48,293.51],
  "ielts-05":[276.27,290.40,343.30,286.92],
  "ielts-06":[275.42,299.85,356.66,295.35],
  ...Object.fromEntries(formsAudio.map(audio=>[audio.prefix,audio.seconds])),
};
const prefixOf=(slug:string)=>Object.hasOwn(listeningFiles,slug)?listeningFiles[slug]:undefined;
// Exact allowlist keeps user input out of filesystem paths. A snapshot explicitly selects its original audio revision.
export function listeningFile(slug:string,part:number,version=2):string|undefined {
  if(Object.hasOwn(jlptAudio,slug)||Object.hasOwn(hskAudio,slug))return Number.isInteger(part)&&part>=1&&part<=4?`${slug}-part-${part}.mp3`:undefined;
  const prefix=version>=2&&Object.hasOwn(revisedAudio,slug)?revisedAudio[slug].prefix:prefixOf(slug);
  return prefix&&Number.isInteger(part)&&part>=1&&part<=4?`${prefix}-part-${part}.mp3`:undefined;
}
export function listeningParts(slug:string,version=2):readonly number[] {
  if(Object.hasOwn(jlptAudio,slug))return jlptAudio[slug].seconds;
  if(Object.hasOwn(hskAudio,slug))return hskAudio[slug].seconds;
  if(version>=2&&Object.hasOwn(revisedAudio,slug))return revisedAudio[slug].seconds;
  const prefix=prefixOf(slug);
  return prefix?listeningSeconds[prefix]:[450,450,450,450];
}
// Which part is playing at `elapsed` stage seconds and where inside it; `ended` once the last part is over.
export function listeningPosition(slug:string,elapsed:number,version=2):{part:number;offset:number;ended:boolean} {
  const parts=listeningParts(slug,version);let start=0;
  for(let index=0;index<parts.length;index++){
    if(elapsed<start+parts[index])return {part:index+1,offset:Math.max(0,elapsed-start),ended:false};
    start+=parts[index];
  }
  return {part:parts.length,offset:parts[parts.length-1],ended:true};
}
