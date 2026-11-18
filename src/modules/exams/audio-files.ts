import revisedData from "./ielts-audio-v2.json" with { type: "json" };
const revisedAudio=revisedData as Record<string,{prefix:string;seconds:number[]}>;
import formsData from "./ielts-forms-audio.json" with { type: "json" };
// Mocks 07–12 (scripts/build-ielts-mocks.mjs) have one recording set each, so no audio revision applies.
const formsAudio=Object.values(formsData as Record<string,{prefix:string;seconds:number[]}>);
import jlptData from './jlpt/audio-catalog.json' with { type: 'json' };
import hskData from './hsk/audio-catalog.json' with { type: 'json' };
import freeData from './free/audio-catalog.json' with { type: 'json' };
import topikData from './topik/audio-catalog.json' with { type: 'json' };
type ItemTimings=Record<string,{seconds:number[];questions:Record<string,{start:number;end:number;part:number}>}>;
const jlptAudio = jlptData as ItemTimings;
// JLPT audio revision 2 (scripts/generate-jlpt-audio-v2.py, VoxCPM2 via VoiceStudio) in assets/jlpt-audio. Attempts
// snapshot `audioRevision`; one without it (started before revision 2) keeps the Kokoro tracks in assets/exams.
import jlptV2Data from './jlpt/audio-catalog-v2.json' with { type: 'json' };
const jlptAudioV2 = jlptV2Data as ItemTimings;
const jlptRevised = (slug:string,version:number)=>version>=2&&Object.hasOwn(jlptAudioV2,slug);
// HSK 1 and 2 (scripts/generate-hsk-audio.py, generate-hsk2-audio.py): four part tracks per mock in assets/hsk-audio, each item read twice.
const hskAudio = hskData as ItemTimings;
// The free half-length mocks (scripts/generate-free-audio.py): IELTS Parts 1–2, JLPT N5/N4 and HSK 1 tracks in
// assets/free-audio, with the same per-item timings as the paid JLPT and HSK catalogues.
const freeAudio = freeData as ItemTimings;
// TOPIK Ⅰ and Ⅱ (scripts/generate-topik-audio.py, VoxCPM2 via VoiceStudio): four part tracks per mock in assets/topik-audio.
// Every TOPIK mock uses this set, so a form whose recording is not made yet never falls back to another folder.
const topikAudio = topikData as ItemTimings;
const isTopik = (slug:string)=>/^topik[12]-mock-0[1-9]$/.test(slug);
/**
 * Which audio route serves a mock. Each route bundles one recording folder into its server function, which must
 * stay under Vercel's 250 MB: `…/audio` serves assets/exams (IELTS 01–06, JLPT), `…/audio/forms` serves
 * assets/ielts-forms (IELTS 07–12), `…/audio/hsk` serves assets/hsk-audio (HSK 1–2) and `…/audio/free` serves
 * assets/free-audio (the free mocks) and `…/audio/jlpt` serves assets/jlpt-audio (JLPT audio revision 2). A new
 * recording set should get its own folder and route segment. `version` is the attempt's or practice form's audio revision.
 */
// TOEFL (assets/toefl-audio) plays one clip per item through `…/audio/toefl` and its own handlers in toefl/audio.ts, not this set.
export type AudioSet="base"|"forms"|"hsk"|"free"|"jlpt"|"topik";
export const audioSetOf=(slug:string,version=2):AudioSet=>Object.hasOwn(formsData,slug)?"forms":Object.hasOwn(hskAudio,slug)?"hsk":isTopik(slug)?"topik":Object.hasOwn(freeAudio,slug)?"free":jlptRevised(slug,version)?"jlpt":"base";
export const audioPath=(slug:string,version=2)=>({base:"/audio",forms:"/audio/forms",hsk:"/audio/hsk",free:"/audio/free",jlpt:"/audio/jlpt",topik:"/audio/topik"} as const)[audioSetOf(slug,version)];
const timed=(catalog:ItemTimings,slug:string,id:string)=>Object.hasOwn(catalog,slug)&&Object.hasOwn(catalog[slug].questions,id)?catalog[slug].questions[id]:undefined;
export function jlptQuestionAudio(slug:string,id:string,version=2) { return (jlptRevised(slug,version)?timed(jlptAudioV2,slug,id):timed(jlptAudio,slug,id))??timed(freeAudio,slug,id); }
/** Where one HSK item (its number and both readings) sits in its part's track, for practice replay. */
export function hskQuestionAudio(slug:string,id:string) { return timed(hskAudio,slug,id)??timed(freeAudio,slug,id); }
/** Where one TOPIK recording (its number and every reading) sits in its part's track, for practice replay. */
export function topikQuestionAudio(slug:string,id:string) { return timed(topikAudio,slug,id); }
/** The TOPIK item being read at `offset` seconds of a part's track (the part's first item before it starts), so the page can follow it. */
export function topikPlayingItem(slug:string,part:number,offset:number):string|undefined {
  if(!Object.hasOwn(topikAudio,slug))return undefined;
  const items=Object.entries(topikAudio[slug].questions).filter(([,range])=>range.part===part).sort((a,b)=>a[1].start-b[1].start);
  return (items.findLast(([,range])=>range.start<=offset)??items[0])?.[0];
}
/** The HSK item being read at `offset` seconds of a part's track (the part's first item during its introduction), so the page can follow it. */
export function hskPlayingItem(slug:string,part:number,offset:number):string|undefined {
  const catalog=Object.hasOwn(hskAudio,slug)?hskAudio:Object.hasOwn(freeAudio,slug)?freeAudio:undefined;
  if(!catalog)return undefined;
  const items=Object.entries(catalog[slug].questions).filter(([,range])=>range.part===part).sort((a,b)=>a[1].start-b[1].start);
  return (items.findLast(([,range])=>range.start<=offset)??items[0])?.[0];
}
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
  if(Object.hasOwn(freeAudio,slug))return Number.isInteger(part)&&part>=1&&part<=freeAudio[slug].seconds.length?`${slug}-part-${part}.mp3`:undefined;
  if(Object.hasOwn(jlptAudio,slug)||Object.hasOwn(hskAudio,slug)||Object.hasOwn(topikAudio,slug))return Number.isInteger(part)&&part>=1&&part<=4?`${slug}-part-${part}.mp3`:undefined;
  const prefix=version>=2&&Object.hasOwn(revisedAudio,slug)?revisedAudio[slug].prefix:prefixOf(slug);
  return prefix&&Number.isInteger(part)&&part>=1&&part<=4?`${prefix}-part-${part}.mp3`:undefined;
}
export function listeningParts(slug:string,version=2):readonly number[] {
  if(Object.hasOwn(freeAudio,slug))return freeAudio[slug].seconds;
  if(jlptRevised(slug,version))return jlptAudioV2[slug].seconds;
  if(Object.hasOwn(jlptAudio,slug))return jlptAudio[slug].seconds;
  if(Object.hasOwn(hskAudio,slug))return hskAudio[slug].seconds;
  if(Object.hasOwn(topikAudio,slug))return topikAudio[slug].seconds;
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
