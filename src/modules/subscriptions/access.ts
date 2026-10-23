import "server-only";
import { getDb } from "@/lib/db";
import { ApiError } from "@/lib/api";
import type { Prisma } from "@/generated/prisma/client";
export class SubscriptionRequired extends ApiError {
  constructor(public program:string) { super(402,"Энэ хөтөлбөрийн сарын эрх шаардлагатай. Эрхээ нээх эсвэл сунгана уу."); }
}
export async function hasSubscription(userId:string,program:string,db:Pick<Prisma.TransactionClient,"subscription">=getDb()) {
  const now=new Date();
  return Boolean(await db.subscription.findFirst({where:{userId,program,startsAt:{lte:now},endsAt:{gt:now}},select:{id:true}}));
}
export async function requireSubscription(userId:string,program:string) {
  if(!await hasSubscription(userId,program))throw new SubscriptionRequired(program);
}
