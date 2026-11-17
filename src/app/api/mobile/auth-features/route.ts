import { privateJson } from "@/lib/api";
import { authFeatures } from "@/lib/auth-features";
import { localPilotEnabled } from "@/lib/local-pilot";
import demoAccounts from "@/data/demo-accounts.json";

// What the mobile app's sign-in screen needs, the same values the website's /login page renders:
// whether Google and email verification are on, and the shared demo accounts when the pilot offers them.
export async function GET() {
  const features = authFeatures(process.env);
  return privateJson({
    google: features.google, email: features.email, requireVerification: features.requireVerification, hostedDemo: features.hostedDemo,
    demoAccounts: localPilotEnabled() || features.hostedDemo ? demoAccounts : [],
  });
}
