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
  return <div className="container page-space profile-page"><div className="account-page-heading"><div><p className="eyebrow">ТАНЫ ОРОН ЗАЙ</p><h1>Миний профайл</h1><p>Бүртгэл, хувийн мэдээлэл, аюулгүй байдал.</p></div><Link className="text-link" href="/dashboard">Миний бэлтгэл рүү ↗</Link></div>
    <div className="profile-layout"><aside className="profile-identity"><div className="profile-cover"/><div className="identity-body"><div className="profile-avatar" aria-hidden="true">{initials || "E"}</div><h2>{user.name}</h2><p className="identity-email">{user.email}</p><span className="identity-badge">{administrator?"Education админ":"Education суралцагч"}</span><dl className="profile-counts"><div><dt>Дууссан дасгал</dt><dd>{exercises}</dd></div><div><dt>Дууссан шалгалт</dt><dd>{exams+officialExams}</dd></div></dl><p className="fine-print">Элссэн огноо<br/><strong>{joined}</strong></p><Link className="button secondary" href="/dashboard">Бэлтгэлээ харах →</Link><SignOut/></div></aside>
    <div className="profile-settings"><SubscriptionOverview userId={user.id}/><section className="settings-card"><div className="settings-heading"><span className="settings-icon" aria-hidden="true">◎</span><div><h2>Хувийн мэдээлэл</h2><p>Өөрийгөө хэрхэн нэрлэхээ сонгоорой.</p></div></div>{sharedDemo ? <p className="fine-print">Нийтийн туршилтын бүртгэл. Нэр, нууц үг өөрчлөхгүй; хувийн мэдээлэл бүү оруулаарай.</p> : <ProfileForm name={user.name}/>}<div className="profile-email"><span>Имэйл хаяг</span><strong>{user.email}</strong><p>{sharedDemo ? "Туршилтын хаяг · бодит имэйл хүлээн авахгүй." : user.emailVerified ? "Имэйл баталгаажсан." : "Имэйл баталгаажаагүй."}</p>{!sharedDemo&&!user.emailVerified&&features.email&&<VerifyEmailButton email={user.email}/>}</div></section>
      <section className="settings-card"><div className="settings-heading"><span className="settings-icon" aria-hidden="true">◇</span><div><h2>Аюулгүй байдал</h2><p>Бүртгэлдээ ашиглах нууц үгээ шинэчлээрэй.</p></div></div>{sharedDemo ? <p>Энэ бүртгэлийг хамтран ашигладаг тул нууц үгийг өөрчлөхгүй.</p> : <PasswordForm/>}{features.google && !sharedDemo && <>{query.error && <p role="alert" className="error-message">Google холбогдсонгүй. Бүртгэлийнхээ имэйлтэй ижил, баталгаажсан Google хаяг сонгоод дахин оролдоорой.</p>}<ConnectGoogle linked={!!googleAccount}/></>}</section>
      <section className="settings-card profile-access"><h2>Миний шалгалтын эрх</h2>{purchases.length?purchases.map(purchase=><div className="purchase-row" key={purchase.id}><div><Link href={"/exams/"+purchase.examSlug}>{findOfficialPaper(purchase.examSlug)?.title??findExam(purchase.examSlug)?.title??purchase.examSlug} ↗</Link><p>{purchase.provider==="LEGACY"?"Өмнөх шалгалтын эрх":"Туршилтын төлбөр · ₮"+purchase.amountMnt.toLocaleString("en-US")}</p></div><Link className="text-link" href={"/checkout/"+purchase.examSlug}>Баримт →</Link></div>):<p>Шалгалтын эрх хараахан аваагүй байна. <Link href="/exams">Шалгалтууд үзэх →</Link></p>}</section>
      {administrator&&<Link className="button primary" href="/admin">Удирдлагын төв →</Link>}
      <p className="fine-print profile-privacy">{sharedDemo ? "Нийтийн demo бүртгэлийн хадгалсан ажил бусад хэрэглэгчид харагдана." : "Хариулт, бичлэг тань хувийнх."} Эрхтэй админ бүртгэл, эрх болон шалгалтын явцын мэдээллийг удирдана.</p></div></div>
  </div>;
}
