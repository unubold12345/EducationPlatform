import { findOfficialPaper } from "@/modules/papers/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getDb } from "@/lib/db";
import { ProfileForm, PasswordForm } from "@/components/profile-form";
import { SignOut } from "@/components/sign-out";
import { findExam } from "@/modules/exams/definitions";
import { SubscriptionOverview } from "@/components/subscription-overview";
import { authFeatures, isDemoEmail } from "@/lib/auth-features";
import { ConnectGoogle } from "@/components/connect-google";
import { VerifyEmailButton } from "@/components/verify-email-button";
import { isAdmin } from "@/modules/admin/service";
import "./profile.css";

export const metadata: Metadata = { title: "Миний профайл" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const user = await requireUser("/profile");
  const administrator = await isAdmin(user.id);
  const features = authFeatures(process.env);
  const sharedDemo = features.hostedDemo && isDemoEmail(user.email);
  const [exercises, exams, purchases, officialExams, googleAccount] = await Promise.all([
    getDb().attempt.count({ where: { userId: user.id, status: "SUBMITTED" } }),
    getDb().mockAttempt.count({ where: { userId: user.id, status: "SUBMITTED" } }),
    getDb().mockPurchase.findMany({where:{userId:user.id,status:"PAID"},orderBy:{createdAt:"desc"},select:{id:true,examSlug:true,provider:true,amountMnt:true}}),
    getDb().paperAttempt.count({where:{userId:user.id,status:"SUBMITTED"}}),
    features.google && !sharedDemo ? getDb().account.findFirst({ where: { userId: user.id, providerId: "google" }, select: { id: true } }) : Promise.resolve(null),
  ]);
  const joined = new Intl.DateTimeFormat("mn-MN", { timeZone: "Asia/Ulaanbaatar", dateStyle: "long" }).format(user.createdAt);
  const initials = user.name.trim().split(/\s+/).slice(0,2).map(part => Array.from(part)[0]).join("").toUpperCase();
  const emailState = sharedDemo ? "Туршилт" : user.emailVerified ? "Баталгаажсан" : "Хүлээгдэж буй";

  return <div className="container page-space profile-page">
    <header className="account-page-heading profile-heading">
      <div>
        <p className="eyebrow">ТАНЫ ОРЧИН</p>
        <h1>Миний профайл</h1>
        <p>Бүртгэл, хувийн мэдээлэл, аюулгүй байдал.</p>
      </div>
      <div className="profile-heading-actions">
        <Link className="button secondary" href="/dashboard">Миний бэлтгэл <span aria-hidden="true">→</span></Link>
        <Link className="text-link" href="/plans">Багцууд <span aria-hidden="true">↗</span></Link>
      </div>
    </header>

    <div className="profile-layout">
      <aside className="profile-identity">
        <div className="profile-cover">
          <span className="profile-cover-grid" aria-hidden="true" />
          <span className="profile-cover-mark" aria-hidden="true">{initials || "E"}</span>
        </div>
        <div className="identity-body">
          <div className="profile-avatar" aria-hidden="true">{initials || "E"}</div>
          <div className="identity-name">
            <h2>{user.name}</h2>
            <span className="identity-badge">{administrator ? "Education админ" : "Education суралцагч"}</span>
          </div>
          <p className="identity-email">{user.email}</p>
          <ul className="identity-signals">
            <li><span>Имэйл</span><strong className={emailState === "Баталгаажсан" ? "signal-good" : ""}>{emailState}</strong></li>
            {features.google && !sharedDemo ? <li><span>Google</span><strong className={googleAccount ? "signal-good" : ""}>{googleAccount ? "Холбогдсон" : "Холбоогүй"}</strong></li> : null}
            <li><span>Шалгалтын эрх</span><strong>{purchases.length}</strong></li>
          </ul>
          <dl className="profile-counts">
            <div><dt>Дууссан дасгал</dt><dd>{exercises}</dd></div>
            <div><dt>Дууссан шалгалт</dt><dd>{exams+officialExams}</dd></div>
          </dl>
          <p className="identity-joined"><span>Элссэн</span><strong>{joined}</strong></p>
          <div className="identity-actions">
            <Link className="button" href="/dashboard">Бэлтгэлээ харах <span aria-hidden="true">→</span></Link>
            <SignOut/>
          </div>
        </div>
      </aside>

      <div className="profile-settings">
        <SubscriptionOverview userId={user.id}/>

        <section className="settings-card profile-info-card">
          <div className="settings-heading">
            <span className="settings-icon" aria-hidden="true">◎</span>
            <div><span className="settings-kicker">01 · ХУВИЙН МЭДЭЭЛЭЛ</span><h2>Хувийн мэдээлэл</h2><p>Нэрээ өөрчилж, имэйлийн төлөвөө шалгаарай.</p></div>
          </div>
          <div className="profile-info-grid">
            <div>
              {sharedDemo ? <p className="profile-note">Нийтийн туршилтын бүртгэл. Нэр, нууц үг өөрчлөхгүй; хувийн мэдээлэл бүү оруулаарай.</p> : <ProfileForm name={user.name}/>}
            </div>
            <div className="profile-email">
              <span>Имэйл хаяг</span>
              <strong>{user.email}</strong>
              <p>{sharedDemo ? "Туршилтын хаяг · бодит имэйл хүлээн авахгүй." : user.emailVerified ? "Имэйл баталгаажсан. Нэвтрэх, хадгалалт, мэдэгдэл энэ хаягаар." : "Имэйл баталгаажаагүй. Нэвтрэхийн тулд хаягаа баталгаажуулна уу."}</p>
              {!sharedDemo&&!user.emailVerified&&features.email&&<VerifyEmailButton email={user.email}/>}
            </div>
          </div>
        </section>

        <section className="settings-card profile-security-card">
          <div className="settings-heading">
            <span className="settings-icon" aria-hidden="true">◇</span>
            <div><span className="settings-kicker">02 · АЮУЛГҮЙ БАЙДАЛ</span><h2>Аюулгүй байдал</h2><p>Нууц үгээ шинэчилж, нэвтрэх аргаа удирдаарай.</p></div>
          </div>
          <div className={features.google&&!sharedDemo ? "profile-security-grid" : ""}>
            <div>
              {sharedDemo ? <p className="profile-note">Энэ бүртгэлийг хамтран ашигладаг тул нууц үгийг өөрчлөхгүй.</p> : <PasswordForm/>}
            </div>
            {features.google&&!sharedDemo ? <div className="profile-google-card">
              {query.error && <p role="alert" className="error-message">Google холбогдсонгүй. Бүртгэлийнхээ имэйлтэй ижил, баталгаажсан Google хаяг сонгоод дахин оролдоорой.</p>}
              <ConnectGoogle linked={!!googleAccount}/>
            </div> : null}
          </div>
        </section>

        <section className="settings-card profile-access">
          <div className="settings-heading">
            <span className="settings-icon" aria-hidden="true">▤</span>
            <div><span className="settings-kicker">03 · ШАЛГАЛТЫН ЭРХ</span><h2>Миний шалгалтын эрх</h2><p>Худалдан авсан шалгалтууд болон баримтууд.</p></div>
          </div>
          {purchases.length ? <div className="profile-purchase-list">{purchases.map(purchase => <div className="purchase-row" key={purchase.id}>
            <span className="purchase-mark" aria-hidden="true">▤</span>
            <div><Link href={"/exams/"+purchase.examSlug}>{findOfficialPaper(purchase.examSlug)?.title??findExam(purchase.examSlug)?.title??purchase.examSlug} <span aria-hidden="true">↗</span></Link><p>{purchase.provider==="LEGACY"?"Өмнөх шалгалтын эрх":"Туршилтын төлбөр · ₮"+purchase.amountMnt.toLocaleString("en-US")}</p></div>
            <Link className="text-link" href={"/checkout/"+purchase.examSlug}>Баримт <span aria-hidden="true">→</span></Link>
          </div>)}</div> : <div className="profile-empty">
            <span aria-hidden="true">◇</span>
            <div><h3>Шалгалтын эрх хараахан аваагүй.</h3><p>Бүтэн mock эсвэл албан материал худалдан авахад эрх энд харагдана.</p></div>
            <Link className="button secondary" href="/exams">Шалгалтууд үзэх <span aria-hidden="true">→</span></Link>
          </div>}
        </section>

        {administrator&&<div className="profile-admin-card">
          <div><span className="settings-kicker">АДМИН</span><h2>Удирдлагын төв</h2><p>Гишүүд, багц, төлбөр, контент, аудит.</p></div>
          <Link className="button primary" href="/admin">Удирдлагын төв <span aria-hidden="true">→</span></Link>
        </div>}
        <p className="fine-print profile-privacy">{sharedDemo ? "Нийтийн demo бүртгэлийн хадгалсан ажил бусад хэрэглэгчид харагдана." : "Хариулт, бичлэг тань хувийнх."} Эрхтэй админ бүртгэл, эрх болон шалгалтын явцын мэдээллийг удирдана.</p>
      </div>
    </div>
  </div>;
}
