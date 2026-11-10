import { ApiError, apiFailure, apiUser, checkOrigin, privateJson, readJson } from "@/lib/api";
import { createCreditOrder } from "@/modules/credits/purchase";

// Starts a simulated AI credit pack purchase. The body is the pack the page showed: { credits, amountMnt }.
export async function POST(request: Request) {
  try {
    checkOrigin(request); const user = await apiUser(request); const input = await readJson(request);
    if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length !== 2) throw new ApiError(400, "Кредитийн багцаа сонгоно уу.");
    const { credits, amountMnt } = input as Record<string, unknown>;
    if (!Number.isSafeInteger(credits) || !Number.isSafeInteger(amountMnt)) throw new ApiError(400, "Кредитийн багцаа сонгоно уу.");
    return privateJson(await createCreditOrder(user.id, { credits: credits as number, amountMnt: amountMnt as number }));
  } catch (error) { return apiFailure(error); }
}
