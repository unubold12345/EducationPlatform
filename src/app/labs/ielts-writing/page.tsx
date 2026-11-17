import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {getSession} from "@/lib/session";
import {writingLabEnabled} from "@/lib/local-pilot";
import {WritingStudio} from "@/modules/writing-lab/client";
import {expertLibrary} from "@/modules/writing-lab/expert-service";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Essay Studio · Workshop",robots:{index:false,follow:false}};
export default async function WritingLabPage(){
 if(!writingLabEnabled())notFound();
 const session=await getSession();
 // The expert review quota and past reviews are read on the server; the page only shows them.
 const expert=session?await expertLibrary(session.user.id):null;
 return <WritingStudio signedIn={!!session} expert={expert}/>;
}
