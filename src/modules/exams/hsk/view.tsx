import type { ReactNode } from "react";
import type { ExamFigure, HskBlank, HskCompose, HskGroup, HskItem, HskLine, HskPicture } from "../types";

/**
 * The page type of a group. HSK 1 has eight parts, read from the immutable group id: hsk-l-1 … hsk-l-4 (Listening),
 * hsk-r-1 … hsk-r-4 (Reading). A group may name the type it is drawn as in `layout` (every HSK 3.0 group does): J is the
 * text-only √/× part, RQ a text with a ★ question and three answers, W1/W2 the HSK 3.0 Writing parts.
 */
export type HskPart = "L1" | "L2" | "L3" | "L4" | "R1" | "R2" | "R3" | "R4" | "J" | "RQ" | "W1" | "W2";
const judged = (part: HskPart) => part === "L1" || part === "R1" || part === "J";
export function hskPart(groupId: string | undefined, group?: HskGroup): HskPart | undefined {
  if (group?.layout) return group.layout;
  const match = /^hsk-([lr])-([1-4])$/.exec(groupId ?? "");
  return match ? (match[1].toUpperCase() + match[2]) as HskPart : undefined;
}
const judgeNames: Record<string, string> = { "√": "Таарч байна", "×": "Таарахгүй" };
/** The answer labels of a part, for a review entry that does not carry its options. */
export function hskOptionLabels(part: HskPart, item?: HskItem, group?: HskGroup) {
  if (judged(part)) return ["√", "×"];
  const set = group?.pictures ?? group?.choices ?? item?.pictures ?? item?.choices ?? [];
  return set.map(entry => entry.label ?? "");
}

/** Listening scripts are stored as Chinese / pinyin line pairs. */
export function transcriptLines(script: string) {
  const lines = script.split("\n"), out: HskLine[] = [];
  for (let i = 0; i < lines.length; i += 2) out.push({ text: lines[i], pinyin: lines[i + 1] ?? "" });
  return out;
}

/** Simplified Chinese with its pinyin line below, as the HSK 1 paper prints it. */
export function ChineseText({ line, readings = true }: { line: HskLine; readings?: boolean }) {
  return <span className="hsk-zh"><span className="hsk-han" lang="zh-CN">{line.text}</span>{readings && line.pinyin ? <span className="hsk-pinyin" lang="zh-Latn-pinyin">{line.pinyin}</span> : null}</span>;
}

/** HSK 3.0 Writing 1: the word with one character drawn as its shown component and an empty box for the missing one. */
export function ComposeWord({ compose }: { compose: HskCompose }) {
  const chars = [...compose.word];
  return <span className="hsk-zh hsk-compose-word">
    <span className="hsk-han" lang="zh-CN">{chars.map((char, index) => index === compose.at
      ? <span key={index} className="hsk-compose" data-gap={compose.gap} role="img" aria-label={`${compose.given} ба дутуу бүрдэл`}><span className="hsk-compose-box" aria-hidden="true"/><span className="hsk-compose-given" aria-hidden="true">{compose.given}</span></span>
      : <span key={index}>{char}</span>)}</span>
    <span className="hsk-pinyin" lang="zh-Latn-pinyin">{compose.pinyin}</span>
  </span>;
}

/** HSK 3.0 Writing 2: the sentence with a gap (its pinyin printed above it) and, while answering, a one-character input. */
export function BlankSentence({ blank, readings, filled, input }: { blank: HskBlank; readings: boolean; filled?: string; input?: ReactNode }) {
  return <span className="hsk-zh hsk-blank-sentence">
    <span className="hsk-han" lang="zh-CN">{blank.before}<span className="hsk-blank"><span className="hsk-blank-hint" lang="zh-Latn-pinyin">{blank.hint}</span>{input ?? <span className="hsk-blank-filled">{filled ?? "　"}</span>}</span>{blank.after}</span>
    {readings && blank.pinyin ? <span className="hsk-pinyin" lang="zh-Latn-pinyin">{blank.pinyin}</span> : null}
  </span>;
}

/** `inline` renders spans, for a picture inside an answer label. */
export function HskImage({ picture, label, inline = false }: { picture: HskPicture | Extract<ExamFigure, { kind: "image" }>; label?: string; inline?: boolean }) {
  // Static answer-free SVG shown as an image, so its own styles stay inside it.
  // eslint-disable-next-line @next/next/no-img-element
  const image = <img src={picture.src} alt={picture.alt} width={480} height={360} loading="lazy" decoding="async"/>;
  if (inline) return <span className="hsk-picture">{image}{label ? <span className="hsk-picture-label" aria-hidden="true">{label}</span> : null}</span>;
  return <figure className="hsk-picture">{image}{label ? <figcaption>{label}</figcaption> : null}</figure>;
}

type QuestionLike = { id: string; number?: string; label?: string; options?: string[]; figure?: ExamFigure; hsk?: HskItem };

/**
 * One HSK question: its own picture, sentence or text choices and the answer buttons for its part.
 * `correct` marks the key after a practice check; it is never sent before that.
 */
export function HskQuestion({ question, part, value, disabled, readings, correct, onChange }: { question: QuestionLike; part: HskPart; value: string | undefined; disabled: boolean; readings: boolean; correct?: string; onChange: (value: string) => void }) {
  const number = question.number ?? question.label ?? "";
  const options = question.options ?? [];
  const pictures = question.hsk?.pictures;
  const choices = question.hsk?.choices;
  const judge = judged(part);
  const variant = judge ? "judge" : pictures ? "pictures" : choices ? "choices" : "letters";
  const blank = question.hsk?.blank;
  const typed = blank ? <input className="hsk-blank-input" type="text" lang="zh-CN" inputMode="text" autoComplete="off" spellCheck={false} maxLength={4} disabled={disabled}
    aria-label={`${number} · ${blank.hint} гэж дуудагдах ханзыг бичнэ үү`} value={value ?? ""} onChange={event => onChange(event.target.value)}/> : null;
  return <div className="hsk-question" data-part={part}>
    {question.figure?.kind === "image" ? <HskImage picture={question.figure}/> : null}
    {question.hsk?.line ? <p className="hsk-line"><ChineseText line={question.hsk.line} readings={readings}/></p> : null}
    {question.hsk?.statement ? <p className="hsk-line hsk-statement"><span aria-hidden="true">★</span><ChineseText line={question.hsk.statement} readings={readings}/></p> : null}
    {question.hsk?.compose ? <p className="hsk-line"><ComposeWord compose={question.hsk.compose}/></p> : null}
    {blank ? <p className="hsk-line"><BlankSentence blank={blank} readings={readings} input={typed}/></p> : null}
    {blank && correct && correct !== (value ?? "").trim() ? <p className="hsk-blank-key">Зөв хариу: <strong lang="zh-CN">{correct}</strong></p> : null}
    {options.length ? <fieldset className={"hsk-options hsk-options-" + variant} disabled={disabled}>
      <legend className="sr-only">{number} · хариулт сонгох</legend>
      {options.map(option => {
        const picture = pictures?.find(item => item.label === option);
        const choice = choices?.find(item => item.label === option);
        return <label key={option} data-selected={value === option ? "" : undefined} data-correct={correct === option ? "" : undefined}>
          <input type="radio" name={"hsk-" + question.id} value={option} checked={value === option} onChange={() => onChange(option)}/>
          {picture ? <><span className="sr-only">{option}</span><HskImage picture={picture} label={option} inline/></> :
            choice ? <><span className="hsk-option-label">{option}</span><ChineseText line={choice} readings={readings}/></> :
            judge ? <><span className="hsk-judge-mark" aria-hidden="true">{option}</span><span className="sr-only">{judgeNames[option] ?? option}</span></> :
            <span className="hsk-option-label">{option}</span>}
        </label>;
      })}
    </fieldset> : null}
  </div>;
}

/** A part's worked example (with its printed answer), then its six shared pictures or its A–F bank. */
export function HskMaterial({ group, readings, example = true }: { group: HskGroup | undefined; readings: boolean; example?: boolean }) {
  if (!group) return null;
  const sample = example ? group.example : undefined;
  return <>
    {sample ? <aside className="hsk-example" aria-label="Жишээ">
      <p className="eyebrow">例如 · Жишээ</p>
      <div className="hsk-example-body">
        {sample.pictures?.map(picture => <div key={picture.src} className="hsk-example-picture" data-answer={picture.label === sample.answer ? "" : undefined}><HskImage picture={picture} label={picture.label}/></div>)}
        {sample.compose ? <div className="hsk-example-text"><p><ComposeWord compose={sample.compose}/></p></div> : null}
        {sample.blank ? <div className="hsk-example-text"><p><BlankSentence blank={sample.blank} readings={readings} filled={sample.answer}/></p></div> : null}
        {sample.line || sample.choices || sample.answerLine ? <div className="hsk-example-text">
          {sample.line ? <p><ChineseText line={sample.line} readings={readings}/></p> : null}
          {sample.statement ? <p className="hsk-statement"><span aria-hidden="true">★</span><ChineseText line={sample.statement} readings={readings}/></p> : null}
          {sample.choices ? <ol className="hsk-example-choices">{sample.choices.map(choice => <li key={choice.label} data-answer={choice.label === sample.answer ? "" : undefined}><span className="hsk-option-label">{choice.label}</span><ChineseText line={choice} readings={readings}/></li>)}</ol> : null}
          {sample.answerLine ? <p className="hsk-example-answer-line"><span className="hsk-option-label">{sample.answerLine.label}</span><ChineseText line={sample.answerLine} readings={readings}/></p> : null}
        </div> : null}
        <p className="hsk-example-answer">Хариу: <strong>{sample.answer}</strong></p>
      </div>
    </aside> : null}
    {group.pictures ? <div className="hsk-picture-grid" role="group" aria-label="Зургууд">{group.pictures.map(picture => <HskImage key={picture.label} picture={picture} label={picture.label}/>)}</div> : null}
    {group.choices ? <ol className="hsk-bank" aria-label="Сонголтууд">{group.choices.map(choice => <li key={choice.label}><span className="hsk-option-label">{choice.label}</span><ChineseText line={choice} readings={readings}/></li>)}</ol> : null}
  </>;
}
