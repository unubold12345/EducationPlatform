import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "./auth";
import { verificationAllowed } from "./auth-features";

export const getSession = cache(async () => {
  const requestHeaders = await headers();
  if (!requestHeaders.get("cookie")) return null;
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  return session && verificationAllowed(session.user, process.env) ? session : null;
});
export async function requireUser(returnPath?: "/profile" | `/checkout/${string}` | `/subscribe/${string}`) {
  const session = await getSession();
  if (!session) redirect(returnPath ? "/login?next=" + encodeURIComponent(returnPath) : "/login");
  return session.user;
}

