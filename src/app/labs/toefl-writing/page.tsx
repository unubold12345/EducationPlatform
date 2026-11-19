import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {getSession} from "@/lib/session";
import {writingLabEnabled} from "@/lib/local-pilot";
import {WritingStudio} from "@/modules/writing-lab/client";
import {expertLibrary} from "@/modules/writing-lab/expert-service";
// The TOEFL task card and Build a Sentence boxes are the TOEFL mocks' own views and styles.
import "@/modules/exams/toefl/toefl.css";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"TOEFL Essay Studio · Workshop",robots:{index:false,follow:false}};

// Workshop → TOEFL → Бичих (owner request 2026-11-19): the IELTS Essay Studio with the TOEFL iBT writing tasks (Build a
// Sentence, Write an Email, Academic Discussion) and the ETS 0-5 scale. Same switch, checks, prices and Claude quota.
export default async function ToeflWritingPage(){
 if(!writingLabEnabled())notFound();
 const session=await getSession();
 const expert=session?await expertLibrary(session.user.id,"toefl"):null;
 return <WritingStudio exam="toefl" signedIn={!!session} expert={expert}/>;
}
