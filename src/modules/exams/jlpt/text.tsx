import { Fragment } from 'react';
/** Render authored readings safely, without HTML injection or a client dictionary that reveals tested kanji. */
export function JapaneseText({text,readings=true}:{text:string;readings?:boolean}) {
 const parts=[];
 const pattern=/([一-龯々]+)（([ぁ-ゖァ-ヺー]+)）|【([^】]+)】/g;
 let cursor=0;
 for(const match of text.matchAll(pattern)){
  parts.push(<Fragment key={match.index+'-before'}>{text.slice(cursor,match.index)}</Fragment>);
  parts.push(match[3]?<strong className="jlpt-target" key={match.index}>{match[3]}</strong>:<ruby key={match.index}>{match[1]}{readings?<rt>{match[2]}</rt>:null}</ruby>);
  cursor=match.index!+match[0].length;
 }
 parts.push(<Fragment key="end">{text.slice(cursor)}</Fragment>);
 return <span lang="ja" className="jlpt-japanese">{parts}</span>;
}
