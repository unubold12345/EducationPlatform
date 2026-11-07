import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {listeningLabEnabled} from "@/lib/local-pilot";
import {ListeningLab} from "@/modules/listening-lab/client";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Listening Lab · Workshop",robots:{index:false,follow:false}};
// Open during a timed mock (owner decision 2026-11-07): the drills are original, unrelated to any mock and use no AI.
export default function ListeningLabPage(){
 if(!listeningLabEnabled())notFound();
 return <ListeningLab/>;
}
