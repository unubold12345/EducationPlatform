import type { Metadata } from "next";
import { MockCollection } from "@/modules/exams/collection";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"IELTS Academic · Бүтэн mock шалгалтууд"};
export default function IeltsCollectionPage(){return <MockCollection program="ielts"/>;}
