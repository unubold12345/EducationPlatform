import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {getSession} from "@/lib/session";
import {speakingLabEnabled} from "@/lib/local-pilot";
import {ToeflSpeaking} from "@/modules/toefl-speaking/client";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"TOEFL Speaking · Workshop",robots:{index:false,follow:false}};

// Workshop → TOEFL → Ярих (owner request 2026-11-19): Listen and Repeat and Take an Interview on the Speaking Lab's
// voices, microphone and transcription; same switch, access check and report price as the IELTS Speaking Lab.
export default async function ToeflSpeakingPage(){
 if(!speakingLabEnabled())notFound();
 const session=await getSession();
 return <ToeflSpeaking signedIn={!!session}/>;
}
