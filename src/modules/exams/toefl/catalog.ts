import data from './catalog.json' with { type: 'json' };
import timelineData from './timeline.json' with { type: 'json' };
/** Client-safe TOEFL iBT catalogue written by scripts/build-toefl-mocks.mjs (no answers, scripts or model answers). */
export type ToeflMock = {slug:string;number:number;title:string;theme:string;questions:{reading:number;listening:number;writing:number;speaking:number};minutes:{lower:number;higher:number}};
export const toeflMocks = data as ToeflMock[];
export const toeflSlugs = () => toeflMocks.map(mock=>mock.slug);
export const isToeflSlug = (slug:string) => toeflMocks.some(mock=>mock.slug===slug);
/** One recording in a listening module: when it starts (stage seconds), how long it plays and when its questions lock. */
export type ToeflClip = {clip:string;start:number;seconds:number;windowEnd:number;questions:string[]};
type FormTimeline = {l1:ToeflClip[];'l2-lower':ToeflClip[];'l2-higher':ToeflClip[];speaking:Record<string,{clip:string;seconds:number;answer?:number}>};
const timelines = timelineData as Record<string,FormTimeline>;
/** The clips of a listening stage on the route its questions belong to (`toefl01-l2u-…` is the Upper route). */
export function toeflListening(slug:string,stageId:string,questionIds:string[]):ToeflClip[] {
  const form=Object.hasOwn(timelines,slug)?timelines[slug]:undefined;
  if(!form)return [];
  if(stageId==='toefl-l1')return form.l1;
  if(stageId!=='toefl-l2')return [];
  return questionIds.some(id=>/-l2u-/.test(id))?form['l2-higher']:form['l2-lower'];
}
/** The clip a speaking or introduction stage plays first, its length and the answer time after the beep. */
export function toeflSpeaking(slug:string,stageId:string) {
  const form=Object.hasOwn(timelines,slug)?timelines[slug]:undefined;
  return form&&Object.hasOwn(form.speaking,stageId)?form.speaking[stageId]:undefined;
}
/** Every clip id a form may play, for the audio allowlist. */
export function toeflClips(slug:string):string[] {
  const form=Object.hasOwn(timelines,slug)?timelines[slug]:undefined;
  if(!form)return [];
  return [...form.l1,...form['l2-lower'],...form['l2-higher']].map(entry=>entry.clip).concat(Object.values(form.speaking).map(entry=>entry.clip));
}
/** Which clip may play `elapsed` seconds into a stage: the listening clip whose time (1 s early, 5 s late) holds it, or a speaking stage's clip in its first seconds. */
export function toeflPlayingClip(slug:string,stageId:string,questionIds:string[],elapsed:number):string|undefined {
  const speaking=toeflSpeaking(slug,stageId);
  if(speaking)return elapsed>=-1&&elapsed<=speaking.seconds+5?speaking.clip:undefined;
  return toeflListening(slug,stageId,questionIds).find(entry=>elapsed>=entry.start-1&&elapsed<=entry.start+entry.seconds+5)?.clip;
}
