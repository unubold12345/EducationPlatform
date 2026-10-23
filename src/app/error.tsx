"use client";
import Link from "next/link";
export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return <div className="container page-space"><h1>Түр алдаа гарлаа.</h1><p>Хуудсыг дахин ачаалж үзнэ үү. Өмнө хадгалсан дасгалууд хэвээр байна.</p><div className="result-actions"><button className="button" onClick={retry}>Дахин оролдох</button><Link className="text-link" href="/">Нүүр хуудас →</Link></div></div>;
}

