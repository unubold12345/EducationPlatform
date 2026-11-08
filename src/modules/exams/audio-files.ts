import jlptData from './jlpt/audio-catalog.json' with { type: 'json' };
const jlptAudio = jlptData as Record<string,{seconds:number[];questions:Record<string,{start:number;end:number;part:number}>}>;
export function jlptQuestionAudio(slug:string,id:string) { return Object.hasOwn(jlptAudio,slug)?jlptAudio[slug].questions[id]:undefined; }
const listeningFiles:Record<string,string>={
  "ielts-academic-01":"ielts-01",
  "ielts-academic-02":"ielts-02",
  "ielts-academic-03":"ielts-03",
  "ielts-academic-04":"ielts-04",
  "ielts-academic-05":"ielts-05",
  "ielts-academic-06":"ielts-06",
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
};
const prefixOf=(slug:string)=>Object.hasOwn(listeningFiles,slug)?listeningFiles[slug]:undefined;
// Exact allowlist keeps user input out of filesystem paths. Existing snapshots retain Mock 01 audio.
export function listeningFile(slug:string,part:number):string|undefined {
  if(Object.hasOwn(jlptAudio,slug))return Number.isInteger(part)&&part>=1&&part<=4?`${slug}-part-${part}.mp3`:undefined;
  const prefix=prefixOf(slug);
  return prefix&&Number.isInteger(part)&&part>=1&&part<=4?`${prefix}-part-${part}.mp3`:undefined;
}
export function listeningParts(slug:string):readonly number[] {
  if(Object.hasOwn(jlptAudio,slug))return jlptAudio[slug].seconds;
  const prefix=prefixOf(slug);
  return prefix?listeningSeconds[prefix]:[450,450,450,450];
}
// Which part is playing at `elapsed` stage seconds and where inside it; `ended` once the last part is over.
export function listeningPosition(slug:string,elapsed:number):{part:number;offset:number;ended:boolean} {
  const parts=listeningParts(slug);let start=0;
  for(let index=0;index<parts.length;index++){
    if(elapsed<start+parts[index])return {part:index+1,offset:Math.max(0,elapsed-start),ended:false};
    start+=parts[index];
  }
  return {part:parts.length,offset:parts[parts.length-1],ended:true};
}
