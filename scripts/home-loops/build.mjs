// Step 2 of the homepage loops: turn the stills from capture.py into three short captioned films.
//
//   node scripts/home-loops/build.mjs            write the HyperFrames projects (artifacts/home-loops/<film>/)
//   npx hyperframes render artifacts/home-loops/<film> -o artifacts/home-loops/<film>.mp4 -q high
//   node scripts/home-loops/build.mjs --publish  compress the renders and posters into public/home/
//
// Each film is a camera over real screenshots: it settles on the page, pushes in on the control being used,
// a pointer clicks it and the film cuts to the next real screen. A caption names each step. Nothing on a
// screen is drawn or edited; only the pointer, the focus frame and the caption are added.
import {copyFileSync,existsSync,mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {dirname,join} from "node:path";
import {fileURLToPath} from "node:url";

const ROOT=join(dirname(fileURLToPath(import.meta.url)),"..","..");
const WORK=join(ROOT,"artifacts","home-loops"),CAPTURE=join(WORK,"capture");
const W=1440,H=900;
const boxes=JSON.parse(readFileSync(join(CAPTURE,"shots.json"),"utf8"));
const box=(shot,key="target")=>boxes[shot][key];
const typing=Array.from({length:10},(_,i)=>"workshop-3-"+i);

// A shot: its screen states, how long it holds, its caption, where the camera pushes in (focus box and zoom),
// pointer stops ({at, to, swap?} = arrive at `to` at second `at`, click, optionally show the next state) and
// whether a focus frame is drawn around `mark`. `end` clicks the last stop just before the cut.
const FILMS={
 "exam-practice":[
  {states:["exam-1"],dur:2.4,cap:"Шалгалтаа сонго",focus:box("exam-1"),zoom:1.5,stops:[{at:1.25,to:box("exam-1")}],end:true},
  {states:["exam-2"],dur:2.4,cap:"Бүтэн mock-оо нээ",focus:box("exam-2"),zoom:1.45,stops:[{at:1.25,to:box("exam-2")}],end:true},
  {states:["exam-3"],dur:2.5,cap:"Дадлагын горим: цаггүй",focus:box("exam-3"),zoom:1.5,stops:[{at:1.3,to:box("exam-3")}],end:true},
  {states:["exam-4a","exam-4b"],dur:3.3,cap:"Хариулаад шууд шалга",focus:[895,560,446,300],zoom:1.5,stops:[{at:1.2,to:box("exam-4a"),swap:1},{at:2.45,to:box("exam-4b")}],end:true,top:true},
  {states:["exam-5"],dur:3.2,cap:"Алдаа бүр тайлбартай",focus:[895,560,490,340],zoom:1.55,mark:box("exam-5"),top:true},
 ],
 "workspace-review":[
  {states:["review-1"],dur:2.6,cap:"Бүх бэлтгэл нэг дор",focus:box("review-1"),zoom:1.4,stops:[{at:1.35,to:box("review-1")}],end:true},
  {states:["review-2"],dur:2.6,cap:"Өгсөн шалгалтаа нээ",focus:[900,226,409,71],zoom:1.4,stops:[{at:1.3,to:[1255,250,50,24]}],end:true},
  {states:["review-3"],dur:3.2,cap:"Оноо, сул чадвараа хар",focus:[300,90,1100,420],zoom:1.28,mark:box("review-3")},
  {states:["review-4"],dur:3.4,cap:"Асуулт бүр тайлбартай",focus:[300,520,696,380],zoom:1.6,mark:[294,670,714,170],top:true},
 ],
 "workshop":[
  {states:["workshop-1"],dur:2.6,cap:"Workshop: дөрвөн чадвар",focus:[390,124,940,720],zoom:1.18,stops:[{at:1.4,to:[616,250,40,40]}],end:true},
  {states:["workshop-2a","workshop-2b"],dur:3.0,cap:"Speaking: AI хамтрагчаа сонго",focus:[340,150,460,400],zoom:1.55,stops:[{at:1.3,to:box("workshop-2a"),swap:1}]},
  {states:typing,dur:3.6,cap:"Writing: бичээд зөвлөгөө ав",focus:[301,250,1000,420],zoom:1.3,swaps:typing.slice(1).map((_,i)=>({at:1.0+i*.22,state:i+1}))},
  {states:["workshop-4"],dur:3.4,cap:"Listening: таван бүрэн тест",focus:[578,128,822,420],zoom:1.45,mark:box("workshop-4")},
 ],
};

const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const r=n=>Math.round(n*1000)/1000;
// Where the stage sits so the focus box lands a little above the middle (the caption is at the bottom).
function camera(focus,zoom){
 const cx=focus[0]+focus[2]/2,cy=focus[1]+focus[3]/2;
 return {scale:zoom,x:r(clamp(W/2-cx*zoom,W*(1-zoom),0)),y:r(clamp(H*.46-cy*zoom,H*(1-zoom),0))};
}
const centre=b=>[r(b[0]+b[2]/2),r(b[1]+Math.min(b[3]/2,b[3]-10))];
const esc=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;");

function film(name,shots){
 let t=0,pointer=[W*.62,H*.78],html="",script="";
 shots.forEach((shot,i)=>{
  const id="s"+(i+1),start=r(t),cam=camera(shot.focus,shot.zoom),stops=shot.stops??[];
  html+=`\n      <div id="${id}" class="clip shot" data-start="${start}" data-duration="${shot.dur}" data-track-index="1" data-layout-allow-overflow>
        <div id="${id}-cam" class="cam">
${shot.states.map((s,k)=>`          <img id="${id}-i${k}" class="still" src="assets/${s}.png" alt="" />`).join("\n")}
${shot.mark?`          <div id="${id}-mark" class="mark" style="left:${shot.mark[0]-6}px;top:${shot.mark[1]-6}px;width:${shot.mark[2]+12}px;height:${shot.mark[3]+12}px"></div>\n`:""}${stops.length?`          <svg id="${id}-ptr" class="ptr" viewBox="0 0 28 28" aria-hidden="true"><path d="M5 3l17 9.2-7.4 2.2-2.6 7.6z" /></svg>\n`:""}        </div>
      </div>
      <div id="${id}-cap" class="clip cap${shot.top?" top":""}" data-start="${start}" data-duration="${shot.dur}" data-track-index="2">
        <div id="${id}-chip" class="chip"><b>${i+1}</b><span>${shot.cap.split(" ").map((w,k)=>`<i id="${id}-w${k}">${esc(w)}</i>`).join(" ")}</span></div>
      </div>`;
  // Camera: arrive slightly large and settle, then push in on the control.
  script+=`\n      // ${i+1}. ${shot.cap}
      tl.fromTo("#${id}-cam",{scale:1.05,x:${r(W*-.025)},y:${r(H*-.025)}},{scale:1,x:0,y:0,duration:.5,ease:"expo.out"},${start});
      tl.fromTo("#${id}-cam",{scale:1,x:0,y:0},{scale:${cam.scale},x:${cam.x},y:${cam.y},duration:.8,ease:"power2.inOut",immediateRender:false},${r(start+.5)});
      tl.fromTo("#${id}-chip",{opacity:0,y:16},{opacity:1,y:0,duration:.3,ease:"power4.out"},${r(start+.1)});\n`;
  shot.cap.split(" ").forEach((_,k)=>{script+=`      tl.fromTo("#${id}-w${k}",{opacity:0,filter:"blur(6px)"},{opacity:1,filter:"blur(0px)",duration:.14,ease:"power2.out"},${r(start+.2+k*.067)});\n`;});
  shot.states.slice(1).forEach((_,k)=>{script+=`      tl.set("#${id}-i${k+1}",{opacity:0},${start});\n`;});
  (shot.swaps??[]).forEach(s=>{script+=`      tl.set("#${id}-i${s.state}",{opacity:1},${r(start+s.at)});\n`;});
  let from=pointer,last=.25;
  stops.forEach((stop,k)=>{
   const to=centre(stop.to),leave=Math.max(last,stop.at-.7);
   script+=`      tl.fromTo("#${id}-ptr",{x:${from[0]},y:${from[1]}},{x:${to[0]},y:${to[1]},duration:${r(stop.at-leave)},ease:"power2.inOut"${k?",immediateRender:false":""}},${r(start+leave)});\n`;
   const isLast=k===stops.length-1,click=isLast&&shot.end?shot.dur-.24:stop.at+.12;
   if(!isLast||shot.end||stop.swap!==undefined){
    script+=`      tl.fromTo("#${id}-ptr",{scale:1},{scale:.78,duration:.08,ease:"power2.in",immediateRender:false},${r(start+click)});
      tl.fromTo("#${id}-ptr",{scale:.78},{scale:1,duration:.14,ease:"back.out(2)",immediateRender:false},${r(start+click+.08)});\n`;
   }
   if(stop.swap!==undefined)script+=`      tl.set("#${id}-i${stop.swap}",{opacity:1},${r(start+click+.1)});\n`;
   from=to;last=click+.25;
  });
  if(shot.mark)script+=`      tl.fromTo("#${id}-mark",{opacity:0,scale:1.06},{opacity:1,scale:1,duration:.35,ease:"power4.out"},${r(start+1.25)});\n`;
  pointer=from;t+=shot.dur;
 });
 const total=r(t);
 return {total,html:`<!doctype html>
<html lang="mn">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      /* Generated by scripts/home-loops/build.mjs: edit the shot list there, not this file. */
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #f4f6fa; }
      #root { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; font-family: Inter, sans-serif; }
      .shot { position: absolute; inset: 0; overflow: hidden; background: #f4f6fa; }
      .cam { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; }
      .still { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; }
      .mark { position: absolute; border: 3px solid #007aff; border-radius: 16px; box-shadow: 0 0 0 7px rgba(0, 122, 255, .16), 0 18px 40px rgba(0, 60, 140, .18); }
      .ptr { position: absolute; left: -5px; top: -3px; width: 30px; height: 30px; overflow: visible; filter: drop-shadow(0 3px 5px rgba(8, 16, 32, .35)); }
      .ptr path { fill: #0b1220; stroke: #fff; stroke-width: 2.2; stroke-linejoin: round; }
      .cap { position: absolute; left: 44px; bottom: 44px; z-index: 5; }
      .cap.top { bottom: auto; top: 44px; }
      .chip { display: inline-flex; align-items: center; gap: 18px; padding: 16px 30px 16px 16px; border-radius: 26px; background: #0b1220; color: #fff; box-shadow: 0 18px 44px rgba(8, 16, 32, .34); }
      .chip b { display: grid; place-items: center; width: 60px; height: 60px; border-radius: 17px; background: #007aff; font-size: 34px; font-weight: 900; }
      .chip span { font-size: 46px; font-weight: 700; letter-spacing: -.02em; line-height: 1.15; white-space: nowrap; }
      .chip i { display: inline-block; font-style: normal; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="${W}" data-height="${H}" data-fps="30">${html}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });${script}
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
`};
}

if(process.argv.includes("--publish")){
 const sharp=(await import("sharp")).default,posterAt={"exam-practice":10.4,"workspace-review":7.6,"workshop":4.6};
 for(const name of Object.keys(FILMS)){
  const source=join(WORK,name+".mp4"),out=join(ROOT,"public","home",name);
  if(!existsSync(source))throw new Error("Render "+name+" first");
  execFileSync("ffmpeg",["-y","-loglevel","error","-i",source,"-c:v","libx264","-preset","slow","-crf","27","-pix_fmt","yuv420p","-an","-movflags","+faststart",out+".mp4"]);
  const frame=join(WORK,name+"-poster.png");
  execFileSync("ffmpeg",["-y","-loglevel","error","-ss",String(posterAt[name]),"-i",source,"-frames:v","1",frame]);
  await sharp(frame).webp({quality:86}).toFile(out+".webp");
  console.log("published "+name);
 }
}else for(const [name,shots] of Object.entries(FILMS)){
 const dir=join(WORK,name);
 if(!existsSync(join(dir,"hyperframes.json")))execFileSync("npx",["hyperframes","init",dir],{stdio:"ignore",shell:true});
 mkdirSync(join(dir,"assets"),{recursive:true});
 for(const still of new Set(shots.flatMap(s=>s.states)))copyFileSync(join(CAPTURE,still+".png"),join(dir,"assets",still+".png"));
 const made=film(name,shots);
 writeFileSync(join(dir,"index.html"),made.html);
 console.log(name+": "+made.total+" s, "+shots.length+" shots");
}
