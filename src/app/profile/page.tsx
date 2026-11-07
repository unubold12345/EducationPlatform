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
import { ProfileTabs } from "@/components/profile-tabs";
import "./profile.css";

export const metadata: Metadata = { title: "Миний профайл" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const user = await requireUser("/profile");
  const administrator = await isAdmin(user.id);
  const features = authFeatures(process.env);
  const sharedDemo = features.hostedDemo && isDemoEmail(user.email);
  const [exams, purchases, officialExams, googleAccount] = await Promise.all([
    getDb().mockAttempt.count({ where: { userId: user.id, status: "SUBMITTED" } }),
    getDb().mockPurchase.findMany({where:{userId:user.id,status:"PAID"},orderBy:{createdAt:"desc"},select:{id:true,examSlug:true,provider:true,amountMnt:true}}),
    getDb().paperAttempt.count({where:{userId:user.id,status:"SUBMITTED"}}),
    features.google && !sharedDemo ? getDb().account.findFirst({ where: { userId: user.id, providerId: "google" }, select: { id: true } }) : Promise.resolve(null),
  ]);
  const joined = new Intl.DateTimeFormat("mn-MN", { timeZone: "Asia/Ulaanbaatar", dateStyle: "long" }).format(user.createdAt);
  const emailPill = sharedDemo ? "" : user.emailVerified ? "ok" : "warn";
  const emailState = sharedDemo ? "Туршилт" : user.emailVerified ? "Баталгаажсан" : "Баталгаажаагүй";

  const profilePanel = <section className="ws-card">
    <h2>Хувийн мэдээлэл</h2>
    {sharedDemo ? <p className="profile-note">Нийтийн туршилтын бүртгэл. Нэр, нууц үг өөрчлөхгүй; хувийн мэдээлэл бүү оруулаарай.</p> : <ProfileForm name={user.name}/>}
    <dl className="profile-facts">
      <div className="profile-email">
        <dt>Имэйл</dt>
        <dd>
          <strong>{user.email}</strong>
          <span className={"ws-pill "+emailPill}>{emailState}</span>
          {sharedDemo&&<p>Туршилтийн хаяг · бодит имэйл хүлээн авахгүй.</p>}
          {!sharedDemo&&!user.emailVerified&&features.email&&<VerifyEmailButton email={user.email}/>}
        </dd>
      </div>
      <div><dt>Элссэн</dt><dd>{joined}</dd></div>
    </dl>
  </section>;

  const plansPanel = <div className="profile-stack">
    <SubscriptionOverview userId={user.id}/>
    <section className="ws-card profile-access">
      <h2>Шалгалтын эрх</h2>
      {purchases.length ? <div className="profile-rows">{purchases.map(purchase => <div className="purchase-row profile-row" key={purchase.id}>
        <div>{findExam(purchase.examSlug)?<Link href={"/exams/"+purchase.examSlug}>{findExam(purchase.examSlug)!.title}</Link>:<span>Хасагдсан албан материал · {purchase.examSlug}</span>}<p>{purchase.provider==="LEGACY"?"Өмнөх шалгалтын эрх":"Туршилтын төлбөр · ₮"+purchase.amountMnt.toLocaleString("en-US")}</p></div>
        <Link className="text-link" href={"/checkout/"+purchase.examSlug}>Баримт</Link>
      </div>)}</div> : <div className="profile-empty">
        <p>Шалгалтын эрх хараахан аваагүй.</p>
        <Link className="text-link" href="/exams">Шалгалтууд үзэх</Link>
      </div>}
    </section>
  </div>;

  const securityPanel = <div className="profile-stack">
    <section className="ws-card">
      <h2>Нууц үг</h2>
      {sharedDemo ? <p className="profile-note">Энэ бүртгэлийг хамтран ашигладаг тул нууц үгийг өөрчлөхгүй.</p> : <PasswordForm/>}
    </section>
    {features.google&&!sharedDemo ? <section className="ws-card">
      <h2>Google</h2>
      {query.error && <p role="alert" className="error-message">Google холбогдсонгүй. Бүртгэлийнхээ имэйлтэй ижил, баталгаажсан Google хаяг сонгоод дахин оролдоорой.</p>}
      <ConnectGoogle linked={!!googleAccount}/>
    </section> : null}
  </div>;

  return <div className="container page-space ws profile-page">
    <header className="profile-heading">
      <h1>Миний профайл</h1>
      <div className="profile-heading-actions">
        {administrator&&<Link className="button secondary" href="/admin">Удирдлагын төв</Link>}
        <SignOut/>
      </div>
    </header>

    <div className="profile-shell">
      <aside className="ws-card profile-summary">
        <div className="identity-body">
          <h2>{user.name}</h2>
          <p className="identity-email">{user.email}</p>
          <span className="identity-badge ws-pill info">{administrator ? "Education админ" : "Education суралцагч"}</span>
        </div>
        <dl className="profile-counts">
          <div><dt>Дууссан шалгалт</dt><dd>{exams+officialExams}</dd></div>
        </dl>
      </aside>

      <ProfileTabs tabs={[
        { id: "profile", label: "Профайл", content: profilePanel },
        { id: "plans", label: "Багц ба эрх", content: plansPanel },
        { id: "security", label: "Аюулгүй байдал", content: securityPanel },
      ]}/>
    </div>
  </div>;
}
