"use client";

import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";

// One sample question per exam, written only for the homepage. These are not mock items: the answer lives here on
// purpose, nothing is saved or scored, and the mocks' own keys stay on the server.
type Sample = { meta: string; passage?: string; prompt: string; reading?: string; options: string[]; labels: string[]; answer: number; explanation: string };
const ABCD = ["A", "B", "C", "D"], N4 = ["1", "2", "3", "4"];

const samples: Record<string, Sample> = {
  sat: { meta: "Digital SAT, Math", prompt: "If 2x − 3 = 11, what is the value of 4x?", options: ["7", "14", "22", "28"], labels: ABCD, answer: 3,
    explanation: "2x − 3 = 11 тул 2x = 14. Асуулт x-ийг биш, 4x-ийг асууж байна: 4x = 2 × 14 = 28. «7» бол x-ийн утга, хамгийн түгээмэл алдаа." },
  ielts: { meta: "IELTS Academic, Reading", passage: "The city library extended its opening hours in 2019, largely because students had asked for more evening study space.", prompt: "The new opening hours were popular with students.", options: ["TRUE", "FALSE", "NOT GIVEN"], labels: ["A", "B", "C"], answer: 2,
    explanation: "Текст цагийг яагаад уртасгасныг (оюутнуудын хүсэлтээр) хэлсэн ч шинэ цаг оюутнуудад таалагдсан эсэхийг хэлээгүй. Мэдээлэл байхгүй бол NOT GIVEN." },
  toefl: { meta: "TOEFL iBT, Reading", passage: "After the spring rains, wildflowers are abundant across the valley, covering the hills in color for several weeks.", prompt: "The word “abundant” in the sentence is closest in meaning to", options: ["plentiful", "fragile", "unusual", "colorful"], labels: ABCD, answer: 0,
    explanation: "abundant = элбэг, их. Толгодыг хэдэн долоо хоног бүрхсэн гэдэг нь цэцэг олон байсныг харуулна: plentiful. «colorful» өгүүлбэрт таарах мэт боловч утга нь өөр." },
  eesh: { meta: "ЭЕШ, Математик", prompt: "log₂8 + √49 илэрхийллийн утгыг ол.", options: ["9", "10", "11", "12", "15"], labels: ["A", "B", "C", "D", "E"], answer: 1,
    explanation: "2³ = 8 тул log₂8 = 3. √49 = 7. Нийлбэр нь 3 + 7 = 10." },
  jlpt: { meta: "JLPT N5, 文法", prompt: "まいあさ　コーヒーを（　）。", options: ["のみます", "たべます", "よみます", "ききます"], labels: N4, answer: 0,
    explanation: "Кофег уудаг: のみます = уух. たべます = идэх, よみます = унших, ききます = сонсох. «Өглөө бүр кофе уудаг.»" },
  hsk: { meta: "HSK 1, 阅读", prompt: "我（　）蒙古人。", reading: "Wǒ (　) Měnggǔ rén.", options: ["是 shì", "有 yǒu", "在 zài", "叫 jiào"], labels: ABCD, answer: 0,
    explanation: "是 (shì) = «бол». 我是蒙古人 = «Би монгол хүн». 有 = байх, эзэмших; 在 = -д байх; 叫 = гэж нэрлэгдэх." },
  topik: { meta: "TOPIK Ⅰ, 읽기", prompt: "저는 몽골 사람(　).", options: ["이에요", "예요", "을", "는"], labels: N4, answer: 0,
    explanation: "사람 гийгүүлэгчээр (ㅁ) төгссөн тул 이에요 залгана: 저는 몽골 사람이에요 = «Би монгол хүн». Эгшгээр төгссөн үгэнд 예요 (의사예요)." },
};

export type TryExam = { slug: string; name: string; href: string; free: number; full: string };

export function HomeTry({ exams }: { exams: TryExam[] }) {
  const [active, setActive] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const exam = exams[active], sample = samples[exam.slug];

  function choose(index: number) {
    setActive(index);
    setPicked(null);
  }
  function onTabKey(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    const to = event.key === "Home" ? 0 : event.key === "End" ? exams.length - 1 : step ? (active + step + exams.length) % exams.length : -1;
    if (to < 0) return;
    event.preventDefault();
    choose(to);
    tabs.current[to]?.focus();
  }

  const answered = picked !== null, correct = picked === sample.answer;
  return <div className="home-try">
    <div className="home-try-head"><h2 id="home-try-title">Нэг асуулт бодоод үз</h2><span>{exam.full}</span></div>
    <div className="home-try-tabs" role="tablist" aria-labelledby="home-try-title" onKeyDown={onTabKey}>
      {exams.map((item, index) => <button key={item.slug} ref={node => { tabs.current[index] = node; }} type="button" role="tab" id={"home-try-tab-" + item.slug} aria-selected={index === active} aria-controls="home-try-panel" tabIndex={index === active ? 0 : -1} onClick={() => choose(index)}>{item.name}</button>)}
    </div>
    <div className="home-try-panel" id="home-try-panel" role="tabpanel" aria-labelledby={"home-try-tab-" + exam.slug}>
      <p className="home-try-meta">{sample.meta}</p>
      {sample.passage && <blockquote>{sample.passage}</blockquote>}
      <p className="home-try-prompt" id="home-try-prompt" lang={exam.slug === "jlpt" ? "ja" : exam.slug === "hsk" ? "zh" : exam.slug === "topik" ? "ko" : undefined}>{sample.prompt}</p>
      {sample.reading && <p className="home-try-reading">{sample.reading}</p>}
      <div className="home-try-options" role="group" aria-labelledby="home-try-prompt">
        {sample.options.map((option, index) => {
          const state = !answered ? undefined : index === sample.answer ? "right" : index === picked ? "wrong" : "rest";
          return <button key={option} type="button" data-state={state} disabled={answered} aria-pressed={picked === index} onClick={() => setPicked(index)}>
            <span className="home-try-bubble" aria-hidden="true">{state === "right" ? "✓" : state === "wrong" ? "✕" : sample.labels[index]}</span>
            <span className="sr-only">{sample.labels[index]}. </span>{option}
          </button>;
        })}
      </div>
      <div className="home-try-result" aria-live="polite">
        {answered ? <>
          <p className="home-try-verdict" data-correct={correct}>{correct ? "Зөв." : `Буруу. Зөв хариулт: ${sample.labels[sample.answer]}.`}</p>
          <p>{sample.explanation}</p>
          <div className="home-try-next"><Link href={exam.href}>{exam.free ? `${exam.name}-ийн үнэгүй mock-оос эхлэх` : `${exam.name}-ийн mock-уудыг үзэх`}</Link><button type="button" onClick={() => setPicked(null)}>Дахин бодох</button></div>
        </> : <p className="home-try-hint">Хариултаа дармагц шалгаж, тайлбарыг нь харуулна. Mock дээрх дадлагын горим яг ингэж ажилладаг.</p>}
      </div>
    </div>
  </div>;
}
