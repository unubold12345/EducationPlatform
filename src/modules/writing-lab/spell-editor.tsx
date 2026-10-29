"use client";
import {useCallback,useEffect,useLayoutEffect,useRef,useState,type KeyboardEvent,type RefObject} from "react";
import {addSpellingWords,checkSpelling,shiftIssues,type SpellDialect,type SpellIssue} from "./spelling";
import styles from "./writing.module.css";

type Props={
 value:string;onChange:(value:string)=>void;dialect:SpellDialect|"off";words:string[];onAddWord:(word:string)=>void;onCount:(count:number|null)=>void;
 editorRef:RefObject<HTMLTextAreaElement|null>;disabled:boolean;placeholder:string;label:string;onKeyDown:(event:KeyboardEvent<HTMLTextAreaElement>)=>void;
};
type Result={text:string;dialect:SpellDialect;issues:SpellIssue[]};
const key=(issue:SpellIssue)=>issue.text.toLowerCase()+"\u0000"+issue.message;

// A transparent mirror behind the textarea draws wavy underlines at the same text positions.
export function SpellEditor({value,onChange,dialect,words,onAddWord,onCount,editorRef,disabled,placeholder,label,onKeyDown}:Props) {
 const [result,setResult]=useState<Result|null>(null);
 const [ignored,setIgnored]=useState<string[]>([]);
 const [pop,setPop]=useState<{index:number;left:number;top:number}|null>(null);
 const mirror=useRef<HTMLDivElement>(null),caret=useRef<number|null>(null),shown=useRef<SpellIssue[]>([]),restore=useRef<number|null>(null);

 const lower=new Set(words.map(w=>w.toLowerCase()));
 const visible=dialect==="off"||!result||result.dialect!==dialect?[]:shiftIssues(result.issues,result.text,value)
  .filter(issue=>!ignored.includes(key(issue))&&!(issue.spelling&&lower.has(issue.text.toLowerCase())))
  .sort((a,b)=>a.start-b.start).filter((issue,i,all)=>i===0||issue.start>=all[i-1].end);
 useEffect(()=>{shown.current=visible;});
 const place=useCallback(()=>{
  const editor=editorRef.current,at=caret.current;
  const index=at===null||!editor||document.activeElement!==editor?-1:shown.current.findIndex(issue=>at>=issue.start&&at<=issue.end);
  const mark=index<0?null:mirror.current?.querySelector<HTMLElement>(`[data-i="${index}"]`);
  if(!mark||!mirror.current){setPop(null);return;}
  const width=mirror.current.clientWidth;
  setPop({index,left:Math.max(12,Math.min(mark.offsetLeft,width-300)),top:mark.offsetTop+mark.offsetHeight-mirror.current.scrollTop+6});
 },[editorRef]);

 useEffect(()=>{
  if(dialect==="off"){onCount(null);return;}
  let cancelled=false;
  const id=window.setTimeout(async()=>{
   try{
    await addSpellingWords(words);
    const issues=await checkSpelling(value,dialect);
    if(cancelled)return;
    setResult({text:value,dialect,issues});
    requestAnimationFrame(place);
   }catch{if(!cancelled){setResult(null);onCount(null);}}
  },320);
  return()=>{cancelled=true;window.clearTimeout(id);};
 },[value,dialect,words,onCount,place]);
 useEffect(()=>{if(dialect!=="off"&&result?.dialect===dialect)onCount(visible.length);});

 const track=()=>{const editor=editorRef.current;caret.current=editor&&editor.selectionStart===editor.selectionEnd?editor.selectionStart:null;requestAnimationFrame(place);};
 const apply=(issue:SpellIssue,text:string)=>{
  onChange(value.slice(0,issue.start)+text+value.slice(issue.end));setPop(null);
  restore.current=issue.start+text.length;caret.current=null;
 };
 // Put the caret after the applied fix as soon as React commits the new text, before the next keystroke.
 useLayoutEffect(()=>{
  const at=restore.current,editor=editorRef.current;
  if(at===null||!editor)return;
  restore.current=null;editor.focus();editor.setSelectionRange(at,at);
 },[value,editorRef]);

 const parts:{text:string;index:number|null}[]=[];let cursor=0;
 visible.forEach((issue,index)=>{if(issue.start>cursor)parts.push({text:value.slice(cursor,issue.start),index:null});parts.push({text:value.slice(issue.start,issue.end),index});cursor=issue.end;});
 parts.push({text:value.slice(cursor)+"​",index:null});
 const issue=pop?visible[pop.index]:undefined;

 return <div className={styles.editorWrap}>
  <div ref={mirror} className={styles.mirror} aria-hidden="true">{parts.map((part,i)=>part.index===null?<span key={i}>{part.text}</span>:<mark key={i} data-i={part.index} data-spelling={visible[part.index].spelling?"":undefined}>{part.text}</mark>)}</div>
  <textarea ref={editorRef} className={styles.editor} value={value} maxLength={7000} spellCheck={false} disabled={disabled} aria-label={label} placeholder={placeholder}
   onChange={event=>{onChange(event.target.value);track();}} onSelect={track} onBlur={()=>requestAnimationFrame(()=>{if(!document.activeElement?.closest(`.${styles.spellPop}`))setPop(null);})}
   onScroll={event=>{if(mirror.current)mirror.current.scrollTop=event.currentTarget.scrollTop;setPop(null);}}
   onKeyDown={event=>{if(event.key==="Escape"&&pop){event.preventDefault();setPop(null);return;}onKeyDown(event);}}/>
  {issue&&pop&&<div className={styles.spellPop} style={{left:pop.left,top:pop.top}} role="dialog" aria-label="Зөв бичгийн санал" onKeyDown={event=>{if(event.key==="Escape"){setPop(null);editorRef.current?.focus();}}}>
   <p className={styles.spellKind} data-spelling={issue.spelling?"":undefined}>{issue.spelling?"Үсгийн алдаа":issue.kind}</p>
   <p className={styles.spellMessage}>{issue.message}</p>
   {issue.suggestions.length>0&&<div className={styles.spellSuggestions}>{issue.suggestions.map(s=><button key={s} type="button" onMouseDown={event=>event.preventDefault()} onClick={()=>apply(issue,s)}>{s||"(устгах)"}</button>)}</div>}
   <div className={styles.spellActions}>
    {issue.spelling&&<button type="button" onMouseDown={event=>event.preventDefault()} onClick={()=>{onAddWord(issue.text);setPop(null);}}>Толь бичигт нэмэх</button>}
    <button type="button" onMouseDown={event=>event.preventDefault()} onClick={()=>{setIgnored(list=>[...list,key(issue)]);setPop(null);}}>Үл тоох</button>
   </div>
  </div>}
 </div>;
}
