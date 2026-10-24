// Keep implicit linking restricted to an already verified local account.
export const accountLinkingPolicy = {
  enabled: true, requireLocalEmailVerified: true, allowDifferentEmails: false,
};

export async function validateGoogleIdentity({ user, source }: {
  user: { emailVerified?: unknown };
  source: { method: string; oauth?: { providerId: string } };
}) {
  if (source.method === "oauth" && source.oauth?.providerId === "google" && user.emailVerified !== true) {
    return { error: "email_not_verified", errorDescription: "A verified Google email is required." };
  }
}
