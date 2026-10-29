// Live spelling and grammar underlines from Harper, which runs as WebAssembly inside the page:
// the essay never leaves the browser for this check. Loaded lazily, only while auto spelling is on.
import type {Lint,LocalLinter} from "harper.js";

export type SpellDialect="uk"|"us";
export type SpellIssue={start:number;end:number;text:string;message:string;kind:string;spelling:boolean;suggestions:string[]};

let current:{dialect:SpellDialect;linter:Promise<LocalLinter>}|null=null;
let words:string[]=[];

async function linterFor(dialect:SpellDialect) {
 if(current?.dialect!==dialect){
  const previous=current;
  current={dialect,linter:(async()=>{
   // Harper's WorkerLinter cannot load the bundler-emitted wasm from its blob worker, so lint on the
   // main thread; an essay-sized check takes milliseconds and runs only after typing pauses.
   const [{LocalLinter,Dialect},{binary}]=await Promise.all([import("harper.js"),import("harper.js/binary")]);
   const linter=new LocalLinter({binary,dialect:dialect==="uk"?Dialect.British:Dialect.American});
   await linter.setup();
   if(words.length)await linter.importWords(words);
   return linter;
  })()};
  const mine=current;
  // A failed download is forgotten so the next check can retry.
  mine.linter.catch(()=>{if(current===mine)current=null;});
  void previous?.linter.then(linter=>linter.dispose()).catch(()=>{});
 }
 return current.linter;
}

export async function addSpellingWords(next:string[]) {
 const added=next.filter(word=>!words.includes(word));words=[...words,...added];
 if(added.length&&current)await (await current.linter).importWords(added);
}

// Harper reports positions in Unicode characters; the textarea counts UTF-16 code units.
function unitOffsets(text:string){
 const offsets=[0];let unit=0;
 for(const char of text){unit+=char.length;offsets.push(unit);}
 return offsets;
}

function replacement(lint:Lint,suggestion:ReturnType<Lint["suggestions"]>[number]){
 const kind=suggestion.kind(),text=suggestion.get_replacement_text();
 return kind===1?"":kind===2?lint.get_problem_text()+text:text;
}

export async function checkSpelling(text:string,dialect:SpellDialect):Promise<SpellIssue[]> {
 if(!text.trim())return [];
 const linter=await linterFor(dialect);
 const lints=await linter.lint(text,{language:"plaintext"});
 const offsets=unitOffsets(text);
 return lints.flatMap(lint=>{
  const span=lint.span(),start=offsets[span.start],end=offsets[span.end];
  if(start===undefined||end===undefined||end<=start)return [];
  const kind=lint.lint_kind(),suggestions=[...new Set(lint.suggestions().map(s=>replacement(lint,s)))].slice(0,4);
  return [{start,end,text:text.slice(start,end),message:lint.message(),kind:lint.lint_kind_pretty()||kind,spelling:kind==="Spelling",suggestions}];
 });
}

// Keeps underlines steady while typing: issues before or after the edited region shift with the
// text, and only those touching the edit wait for the next check.
export function shiftIssues(issues:SpellIssue[],from:string,to:string):SpellIssue[] {
 if(from===to)return issues;
 let prefix=0;const max=Math.min(from.length,to.length);
 while(prefix<max&&from[prefix]===to[prefix])prefix++;
 let suffix=0;
 while(suffix<max-prefix&&from[from.length-1-suffix]===to[to.length-1-suffix])suffix++;
 const editEnd=from.length-suffix,delta=to.length-from.length;
 return issues.flatMap(issue=>issue.end<=prefix?[issue]:issue.start>=editEnd?[{...issue,start:issue.start+delta,end:issue.end+delta}]:[]);
}
