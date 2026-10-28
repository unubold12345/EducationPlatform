import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Хуудас олдсонгүй" };

export default function NotFound() {
  return <div className="container page-space not-found">
    <p className="eyebrow">404 · ХУУДАС ОЛДСОНГҮЙ</p>
    <h1>Энэ хуудас <span>олдсонгүй.</span></h1>
    <p>Холбоос хуучирсан эсвэл хуудас зөөгдсөн байна. Бэлтгэлээ үргэлжлүүлэх хоёр зам энд байна.</p>
    <div className="not-found-actions"><Link className="button" href="/">Нүүр хуудас →</Link><Link className="text-link" href="/exams">Шалгалтууд үзэх →</Link></div>
    <div className="not-found-index" aria-hidden="true">404</div>
  </div>;
}
