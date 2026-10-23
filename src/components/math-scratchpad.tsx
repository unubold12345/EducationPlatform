"use client";

import { useId, useRef, useState, type PointerEvent } from "react";

type Point = [number, number];
type Draft = { strokes: Point[][]; notes: string };
const empty = (): Draft => ({ strokes: [], notes: "" });
const pointCount = (draft: Draft) => draft.strokes.reduce((n, stroke) => n + stroke.length, 0);
function valid(value: Draft): boolean {
  return !!value && typeof value.notes === "string" && value.notes.length <= 8000 &&
    Array.isArray(value.strokes) && value.strokes.length <= 200 &&
    value.strokes.every(stroke => Array.isArray(stroke) && stroke.length <= 1500 &&
      stroke.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) &&
        p[0] >= 0 && p[0] <= 1000 && p[1] >= 0 && p[1] <= 600)) && pointCount(value) <= 12000;
}
const path = (points: Point[]) => points.map(([x,y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ") + " l0.01,0.01";

export function MathScratchpad({ attemptId }: { attemptId: string }) {
  const panelId = useId();
  const [open, setOpen] = useState(false), [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState<Draft>(empty), [line, setLine] = useState<Point[]>([]);
  const [message, setMessage] = useState(""), [confirmClear, setConfirmClear] = useState(false);
  const drawing = useRef<{ id: number; points: Point[] } | null>(null);
  const storageKey = "education-scratchpad-v1:" + attemptId;
  function toggle() {
    if (!loaded) {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw && raw.length <= 500000) {
          const saved: Draft = JSON.parse(raw);
          if (valid(saved)) setDraft(saved);
          else setMessage("Хуучин нооргийг нээж чадсангүй. Шинэ цаас ашиглана уу.");
        }
      } catch { setMessage("Энэ хөтөч нооргийг хадгалах боломжгүй. Хуудсыг хаавал ноорог арилна."); }
      setLoaded(true);
    }
    setOpen(!open);
  }
  function save(next: Draft) {
    setDraft(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setMessage("Энэ хөтөч дээр хадгалсан"); }
    catch { setMessage("Ноорог хадгалагдсангүй. Хуудсыг хаавал арилна."); }
  }
  function position(event: PointerEvent<SVGSVGElement>): Point {
    const bounds = event.currentTarget.getBoundingClientRect();
    return [Math.round(Math.max(0, Math.min(1000, (event.clientX-bounds.left)/bounds.width*1000))),
      Math.round(Math.max(0, Math.min(600, (event.clientY-bounds.top)/bounds.height*600)))];
  }
  function begin(event: PointerEvent<SVGSVGElement>) {
    if (drawing.current || event.button !== 0) return;
    if (draft.strokes.length >= 200 || pointCount(draft) >= 12000) {
      setMessage("Цаас дүүрсэн байна. Сүүлийн зураасыг буцаах эсвэл цаасыг цэвэрлэнэ үү."); return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    const points = [position(event)]; drawing.current = { id: event.pointerId, points }; setLine(points);
  }
  function move(event: PointerEvent<SVGSVGElement>) {
    const active = drawing.current;
    if (!active || active.id !== event.pointerId || active.points.length >= 1500 || pointCount(draft)+active.points.length >= 12000) return;
    active.points.push(position(event)); setLine([...active.points]);
  }
  function finish(event: PointerEvent<SVGSVGElement>) {
    const active = drawing.current;
    if (!active || active.id !== event.pointerId) return;
    drawing.current = null; setLine([]); save({ ...draft, strokes: [...draft.strokes, active.points] });
  }
  return <section className="math-scratchpad">
    <button className="button secondary scratch-toggle" type="button" aria-expanded={open} aria-controls={panelId} onClick={toggle}>
      <span aria-hidden="true">✎</span> Ноорог цаас <span aria-hidden="true">{open ? "−" : "+"}</span>
    </button>
    <div id={panelId} hidden={!open} className="scratch-panel">
      <div className="scratch-heading"><div><h2>Бодолтоо энд хийгээрэй</h2><p>Хулгана, үзэг эсвэл хуруугаар зурж болно. Ноорог үнэлгээнд орохгүй. Шалгалтын цаг үргэлжилнэ.</p></div>
        <div className="scratch-actions"><button type="button" className="admin-small-button" disabled={!draft.strokes.length} onClick={()=>save({...draft, strokes:draft.strokes.slice(0,-1)})}>Сүүлийн зураасыг буцаах</button>
          <button type="button" className="admin-small-button" disabled={!draft.strokes.length&&!draft.notes} onClick={()=>setConfirmClear(true)}>Цэвэрлэх</button></div></div>
      {confirmClear && <div className="scratch-confirm" role="group" aria-label="Ноорог цэвэрлэх баталгаажуулалт"><p>Бүх зураг, тэмдэглэлийг арилгах уу?</p><button type="button" className="admin-small-button" onClick={()=>{save(empty());setConfirmClear(false);}}>Тийм, арилгах</button><button type="button" className="admin-small-button" onClick={()=>setConfirmClear(false)}>Болих</button></div>}
      <svg className="scratch-paper" viewBox="0 0 1000 600" preserveAspectRatio="none" role="img" aria-label="Ноорог зурах талбай" onPointerDown={begin} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}>
        {draft.strokes.map((stroke,i)=><path key={i} d={path(stroke)}/>)}{line.length>0&&<path d={path(line)}/>} 
      </svg>
      <label className="scratch-notes">Бичгэн тэмдэглэл<textarea rows={3} maxLength={8000} value={draft.notes} onChange={event=>save({...draft,notes:event.target.value})} placeholder="Томьёо, завсрын бодолт…"/></label>
      <p className="fine-print">Зөвхөн энэ төхөөрөмжийн хөтөч дээр хадгалагдана. Нийтийн төхөөрөмж ашиглавал дууссаны дараа цэвэрлээрэй.</p>
      <p className="fine-print scratch-status" role="status">{message}</p>
    </div>
  </section>;
}

