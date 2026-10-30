import type { Metadata } from "next";
import { MockCollection } from "@/modules/exams/collection";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Digital SAT · Бүтэн mock шалгалтууд"};
export default function SatCollectionPage(){return <MockCollection program="sat"/>;}
