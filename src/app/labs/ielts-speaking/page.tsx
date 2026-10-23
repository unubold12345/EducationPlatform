import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {getSession} from "@/lib/session";
import {localPilotEnabled} from "@/lib/local-pilot";
import {SpeakingLab} from "@/modules/speaking-lab/client";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"IELTS Speaking Lab · Experimental",robots:{index:false,follow:false}};
export default async function SpeakingLabPage(){if(!localPilotEnabled())notFound();const session=await getSession();return <SpeakingLab signedIn={!!session}/>;}
