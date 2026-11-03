import test from "node:test";
import assert from "node:assert/strict";
import {exerciseSets,originalExerciseSets,findExercise,publicExercise} from "../src/modules/exercises/content.ts";
import {supportsMathTutor} from "../src/modules/exercises/math-support.ts";
import {gradeExercise} from "../src/modules/exercises/grading.ts";
import {practiceDisplayText} from "../src/modules/exercises/display-text.ts";

const added=exerciseSets.filter(s=>!originalExerciseSets.includes(s));
const answer=(slug,i)=>{const q=findExercise(slug).questions[i];return q.options[q.correct];};

test("display typography separates Mongolian quantities without changing algebra or stored prompts",()=>{
  const text='8Ом эсэргүүцлээр3А гүйдэл гүйвэл хүчдэл хэд вэ?';
  assert.equal(practiceDisplayText(text),'8 Ом эсэргүүцлээр 3 А гүйдэл гүйвэл хүчдэл хэд вэ?');
  assert.equal(text,'8Ом эсэргүүцлээр3А гүйдэл гүйвэл хүчдэл хэд вэ?');
  assert.equal(practiceDisplayText('f(x)=2x²−3x+4; sinα=3/5; 60°'),'f(x)=2x²−3x+4; sinα=3/5; 60°');
  assert.equal(practiceDisplayText('Усыг5°C-аар халаана.'),'Усыг 5 °C-аар халаана.');
});

test("expansion adds ten original eight-question sets per program without replacing legacy content",()=>{
  assert.equal(originalExerciseSets.length,10);assert.equal(added.length,30);
  const prompts=new Set(originalExerciseSets.flatMap(s=>s.questions.map(q=>q.prompt)));
  for(const p of ['sat','ielts','entrance'])assert.equal(added.filter(s=>s.program===p).length,10);
  for(const s of added){
    assert.equal(s.questions.length,8);assert.equal(s.examId,s.slug+'-v1');
    assert.ok(!originalExerciseSets.some(old=>old.slug===s.slug));
    for(const q of s.questions){
      assert.ok(!prompts.has(q.prompt),q.id);prompts.add(q.prompt);
      assert.ok(q.options.every(option=>option.trim()));assert.ok(q.explanation.length>=30,q.id);
    }
    assert.equal(gradeExercise(s,{answers:s.questions.map(q=>q.correct)}).score,8);
    assert.ok(publicExercise(s).questions.every(q=>!('correct'in q)&&!('explanation'in q)));
  }
  assert.equal(added.filter(s=>s.subject==='Reading and Writing').length,6);
});

test("new mathematics and physics answer keys agree with independent calculations",()=>{
  const expected={
    'sat-algebra-systems':[String((24-6)/(5-3)),'y = −2x + 1',String(5+1),'t ≤ 16','−4',String((355-40*7)/(12-7)),String((29+3)/4),'6'],
    'sat-advanced-functions':['(−3, −5)','(x − 5)²',String(640/2**3),'x − 1','x ≥ 4',String((2*3+1)**2),String(4*7),'The output doubles'],
    'sat-data-probability':[String(Math.round(1.2*.8*100))+'%',String(56*5/8),'3/8','6',String(19-(1.5*8+4)),'The sample may have self-selection bias',String((6*14+18+22)/8),'It provides a comparison for what happens without the treatment'],
    'sat-geometry-circles':['6π','(−2, 5)',String(Math.sqrt(17**2-8**2)),String(27*(4/3)**2),'48π','7/24','π/3',String(210/(5*7))],
    'entrance-math-functions':[String(2*(-2)**2-3*(-2)+4),String(3+6),'x≤5','x=1 эсвэл x=5','(0,8)',String(9*4),String(11-9),'x≤−4'],
    'entrance-math-sequences':['4','5',String(7+7*4),String(10*(2+29)/2),String(3*2**5),'3+log₂a',String(Math.cbrt(27)**2),'80'],
    'entrance-math-probability':[String(4*3/2),'1/2','3/10','4','8',String(3*4),'2/5',String((10*72+5*84)/15)],
    'entrance-math-geometry':['54 см²','12π см','4:25','42 м³','540°','5','4/5','36π м³'],
    'entrance-physics-mechanics':['10 м/с','25 м','12 кг·м/с','36 Ж','15 Н','2.7 г/см³','−5 м/с²','6 Н'],
    'entrance-physics-circuits':['24 В','24 Вт',String(1/(1/6+1/3))+' Ом','9 Ом',String(.5*2*60)+' Кл','1200 Ж','6 А','7 В'],
    'entrance-physics-thermal-waves':[String(.2*4200*5)+' Ж','35°C',String(5*2)+' м/с',String(1/4)+' с',String(340/170)+' м',String(150*4)+' Ж','30°',String(50/10)+' Гц'],
  };
  for(const [slug,values]of Object.entries(expected))values.forEach((value,i)=>assert.equal(answer(slug,i),value,`${slug} q${i+1}`));
});

test("reading exercises carry their source passage and distinguish explicit contradiction from missing information",()=>{
  const readings=added.filter(s=>s.questions[0].prompt.includes('[QUESTION]'));
  assert.equal(readings.length,7);
  for(const s of readings){
    const texts=s.questions.map(q=>q.prompt.split('[QUESTION]')[0].trim());
    assert.equal(new Set(texts).size,1);assert.ok(texts[0].split(/\s+/).length>=150);
    const truth=s.questions.filter(q=>q.options.includes('Not Given'));
    assert.equal(truth.length,3,s.slug);
    assert.deepEqual(new Set(truth.map(q=>q.options[q.correct])),new Set(['True','False','Not Given']));
  }
});

test("math tutor capability includes new quantitative sets and rejects language exercises, including published versions",()=>{
  for(const s of exerciseSets){
    const quantitative=s.program==='sat'&&s.subject!=='Reading and Writing'||s.program==='entrance'&&['Математик','Физик'].includes(s.subject);
    assert.equal(supportsMathTutor(s.examId),quantitative,s.slug);
    assert.equal(supportsMathTutor(s.slug+'-published-v2'),quantitative,s.slug);
  }
  assert.equal(supportsMathTutor('sat-algebra-demo-v1'),true);
  for(const id of ['sat-rw-evidence-v1','entrance-english-reading-v1','ielts-language-clauses-v1','unknown-v1'])assert.equal(supportsMathTutor(id),false);
});
