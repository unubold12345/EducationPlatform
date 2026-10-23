import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import { site } from "@/lib/site";
import { ThemeToggle } from "@/components/theme-toggle";
import { MainNavigation } from "@/components/main-navigation";
import { EducationBackdrop } from "@/components/education-backdrop";
import { AccountLink } from "@/components/account-link";
import "./globals.css";

const manrope = localFont({ src: "./fonts/Manrope-Variable.ttf", variable: "--font-ui", weight: "200 800", display: "swap" });

const themeScript = `(function(){var t;try{t=localStorage.getItem('education-theme')}catch{}document.documentElement.dataset.theme=t==='dark'||t==='light'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'})()`;

export const metadata: Metadata = {
  title: { default: "Education — Суралцах дараагийн алхам", template: "%s | Education" },
  description: "SAT, IELTS, элсэлтийн бэлтгэлийн 80 асуулт, бичих болон ярих 4 даалгавар.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="mn" className={manrope.variable} suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body>
    <a className="skip-link" href="#main">Үндсэн агуулга руу</a>
    <header className="site-header"><div className="header-inner">
      <Link href="/" className="brand" aria-label="Education нүүр хуудас"><span className="brand-mark" aria-hidden="true">e<span>·</span></span><span>{site.name}<small>СУРАЛЦАХ ДАРААГИЙН АЛХАМ</small></span></Link>
      <MainNavigation />
      <div className="header-actions"><ThemeToggle /><AccountLink /></div>
    </div></header>
    <main id="main"><EducationBackdrop />{children}</main>
    <footer className="site-footer"><div><Link href="/" className="footer-brand">Education<span>·</span></Link><p>{site.descriptor}</p></div><p>SAT · IELTS · Элсэлтийн бэлтгэл<br />College Board болон IELTS-ийн албан ёсны үйлчилгээ биш.</p></footer>
  </body></html>;
}



