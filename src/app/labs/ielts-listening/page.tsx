import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {listeningLabEnabled} from "@/lib/local-pilot";
import {ListeningLab} from "@/modules/listening-lab/client";
import {getSession} from "@/lib/session";
import {labMocks} from "@/modules/exam-practice/lab-mocks";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Listening Lab · Workshop",robots:{index:false,follow:false}};
// Open during a timed mock (owner decision 2026-11-07): the drills are original, unrelated to any mock and use no AI.
// Since 2026-11-19 (owner request) the IELTS mocks' listening is listed under them too; each opens in the lab mock page,
// which checks the mock's access and closes during a timed sitting like practice mode.
export default async function ListeningLabPage(){
 if(!listeningLabEnabled())notFound();
 const session=await getSession();
 return <ListeningLab mocks={await labMocks(session?.user.id,"ielts","listening")}/>;
}
