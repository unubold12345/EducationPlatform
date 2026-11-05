// Rendered on the server and passed to the workspace as ready HTML, so KaTeX and the
// other variants never enter the client bundle.
import "katex/dist/katex.min.css";
import "./questions.css";
import { mathFormulaSheet,mathPartOneNote } from "./math-2020/index";
import type { PaperFill,PaperQuestion,PaperVariantContent } from "./math-2020/types";
import { renderMathText } from "./math-render";
import { QuestionFigure } from "./question-figures";
const Rich=({text,as:Tag="span",className}:{text:string;as?:"span"|"p"|"li"|"td"|"th";className?:string})=><Tag className={className} dangerouslySetInnerHTML={{__html:renderMathText(text)}}/>;
const letters="ABCDE";
function ChoiceBody({question}:{question:PaperQuestion}){
 return <>
  <Rich as="p" text={question.prompt}/>
  {question.data&&<Rich as="p" className="paper-question-data" text={question.data}/>}
  {question.table&&<div className="paper-question-table"><table><tbody>{question.table.rows.map(row=><tr key={row[0]}>{row.map((cell,i)=>i?<td key={i}>{cell}</td>:<th key={i} scope="row">{cell}</th>)}</tr>)}</tbody></table></div>}
  {question.figure&&<QuestionFigure figure={question.figure}/>}
 </>;
}
function FillBody({question}:{question:PaperFill}){
 return <>
  <Rich as="p" text={question.prompt}/>
  {question.figure&&<QuestionFigure figure={question.figure}/>}
  <p className="paper-question-work"><em>Бодолт:</em> <Rich text={question.work}/></p>
 </>;
}
export function paperFormulaSheet(){
 return <details className="paper-formulas"><summary>{mathFormulaSheet.title}</summary><ol>{mathFormulaSheet.items.map(item=><Rich key={item} as="li" text={item}/>)}</ol><QuestionFigure figure={{kind:"grid"}}/></details>;
}
export function PaperQuestions({content}:{content:PaperVariantContent}){
 return <div className="paper-questions">
  {paperFormulaSheet()}
  <h2>Нэгдүгээр хэсэг · Сонгох даалгавар</h2>
  <p className="paper-part-note">{mathPartOneNote}</p>
  {content.choices.map(question=><article className="paper-question" data-question={question.id} key={question.id}>
   <header><strong>{question.id}.</strong><small>{question.marks} оноо</small></header>
   <ChoiceBody question={question}/>
   <ol className="paper-question-options">{question.options.map((option,i)=><li key={letters[i]}><b>{letters[i]}.</b><Rich text={option}/></li>)}</ol>
  </article>)}
  <h2>Хоёрдугаар хэсэг · Нөхөх даалгавар</h2>
  {content.fills.map(question=><article className="paper-question" data-question={question.id} key={question.id}>
   <header><strong>{question.id}</strong><small>{question.marks} оноо</small></header>
   <FillBody question={question}/>
  </article>)}
 </div>;
}
// Practice mode shows one question at a time, with its options inside the answer buttons.
export function renderedPaperQuestions(content:PaperVariantContent){
 return Object.fromEntries([
  ...content.choices.map(question=>[question.id,{body:<div className="paper-questions"><ChoiceBody question={question}/></div>,options:question.options.map(option=><Rich key={option} text={option}/>)}] as const),
  ...content.fills.map(question=>[question.id,{body:<div className="paper-questions"><FillBody question={question}/></div>}] as const),
 ]);
}
