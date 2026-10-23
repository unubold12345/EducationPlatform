import { redirect,notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { paperAttempt } from "@/modules/papers/service";
import { ApiError } from "@/lib/api";
import { PaperWorkspace } from "@/modules/papers/workspace";
export const metadata={title:"ЭЕШ · Математикийн шалгалт",robots:{index:false,follow:false}};
export default async function PaperPage({params}:{params:Promise<{id:string}>}){const session=await getSession();if(!session)redirect("/login");let initial;try{initial=await paperAttempt((await params).id,session.user.id);}catch(error){if(error instanceof ApiError&&error.status===404)notFound();throw error;}return <PaperWorkspace initial={initial}/>;}
