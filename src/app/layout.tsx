import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import { site } from "@/lib/site";
import { ThemeToggle } from "@/components/theme-toggle";
import { MainNavigation } from "@/components/main-navigation";
import { EducationBackdrop } from "@/components/education-backdrop";
import { AccountLink } from "@/components/account-link";
import "./globals.css";
import "./theme.css";
import "./footer-compact.css";

// Mongolian Ө and Ү live in the cyrillic-ext subset, so both Cyrillic subsets are required.
const uiFont = Inter({ subsets: ["latin", "cyrillic", "cyrillic-ext"], variable: "--font-ui", display: "swap" });

const themeScript = `(function(){var t;try{t=localStorage.getItem('education-theme')}catch{}document.documentElement.dataset.theme=t==='dark'||t==='light'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var a;try{a=localStorage.getItem('education-account')}catch{}document.documentElement.dataset.account=a==='member'?'member':'guest';var r;try{r=localStorage.getItem('education-workspace-rail')}catch{}if(r==='collapsed')document.documentElement.dataset.wsRail='collapsed'})()`;

export const metadata: Metadata = {
  title: { default: "Education — Суралцах дараагийн алхам", template: "%s | Education" },
  description: "SAT, IELTS, ЭЕШ, JLPT, HSK mock шалгалт, цаггүй дадлага, AI туслах, ярих, бичих, сонсох Workshop — нэг Workspace-д.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="mn" className={uiFont.variable} data-scroll-behavior="smooth" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body>
    <a className="skip-link" href="#main">Үндсэн агуулга руу</a>
    <header className="site-header"><div className="header-inner">
      <Link href="/" className="brand" aria-label="Education нүүр хуудас"><span className="brand-mark" aria-hidden="true">e<span>·</span></span><span className="brand-word">{site.name}<small>EXAM PREP · 2026</small></span></Link>
      <MainNavigation />
      <div className="header-actions"><ThemeToggle /><AccountLink /></div>
    </div></header>
    <main id="main"><EducationBackdrop />{children}</main>
    <footer className="site-footer"><div className="footer-inner">
      <div className="footer-brand-block"><Link href="/" className="footer-brand">Education<span>·</span></Link></div>
      <div className="footer-links" role="navigation" aria-label="Хөлийн цэс"><Link href="/#programs">Хөтөлбөрийн сан</Link><Link href="/exams">Шалгалтын сан</Link><Link href="/workspace/workshop">Workshop</Link><Link href="/workspace">Workspace</Link></div>
      <p className="footer-note"><strong>SAT · IELTS · ЭЛСЭЛТ</strong>College Board болон IELTS-ийн албан ёсны үйлчилгээ биш.</p>
    </div></footer>
  </body></html>;
}



