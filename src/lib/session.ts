import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "./auth";

export const getSession = cache(async () => {
  const requestHeaders = await headers();
  if (!requestHeaders.get("cookie")) return null;
  return getAuth().api.getSession({ headers: requestHeaders });
});
export async function requireUser(returnPath?: "/profile" | `/checkout/${string}` | `/subscribe/${string}`) {
  const session = await getSession();
  if (!session) redirect(returnPath ? "/login?next=" + encodeURIComponent(returnPath) : "/login");
  return session.user;
}

