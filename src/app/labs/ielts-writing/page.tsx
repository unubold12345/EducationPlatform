import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {getSession} from "@/lib/session";
import {writingLabEnabled} from "@/lib/local-pilot";
import {WritingStudio} from "@/modules/writing-lab/client";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Essay Studio · Workshop",robots:{index:false,follow:false}};
export default async function WritingLabPage(){if(!writingLabEnabled())notFound();const session=await getSession();return <WritingStudio signedIn={!!session}/>;}
