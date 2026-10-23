import type { Prisma } from "@/generated/prisma/client";
// Disposable integration accounts use the reserved .invalid domain. Never delete
// them to clean up reporting; apply the same explicit scope to lists and exports.
export function adminUserScope(testData:boolean):Prisma.UserWhereInput {
  return testData?{email:{endsWith:"@example.invalid",mode:"insensitive"}}:{NOT:{email:{endsWith:".invalid",mode:"insensitive"}}};
}
export const realPaymentScope={provider:{notIn:["MOCK","LEGACY"]}};
