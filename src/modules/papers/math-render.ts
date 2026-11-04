import katex from "katex";
const escapeHtml=(text:string)=>text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
// A printed answer box in a fill-in question, such as the [de] cell.
const macros={"\\cell":"\\boxed{\\mathit{#1}}"};
// Static reviewed exam text only. Throws on bad LaTeX so tests catch it before students could.
export function renderMathText(text:string){
 return text.split(/\$([^$]+)\$/).map((part,i)=>i%2?katex.renderToString("\\displaystyle "+part,{throwOnError:true,strict:false,macros:{...macros}}):escapeHtml(part)).join("");
}
