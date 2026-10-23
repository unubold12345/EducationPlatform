import Link from "next/link";
export default function NotFound() {
  return <div className="container page-space"><p className="eyebrow">404</p><h1>Энэ хуудас олдсонгүй.</h1><p>Хөтөлбөрийн жагсаалтаас үргэлжлүүлээрэй.</p><Link className="button" href="/programs">Хөтөлбөрүүд үзэх →</Link></div>;
}

