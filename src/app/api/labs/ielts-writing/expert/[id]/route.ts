import {apiFailure,apiUser,privateJson} from "@/lib/api";
import {openExpertReview} from "@/modules/writing-lab/expert-service";

type Context={params:Promise<{id:string}>};

// One of the student's own expert reviews, with the text it reviewed.
export async function GET(request:Request,context:Context) {
 try{const user=await apiUser(request);const {id}=await context.params;return privateJson({review:await openExpertReview(user.id,id)});}
 catch(error){return apiFailure(error);}
}
