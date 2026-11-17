import { apiFailure, apiUser, privateJson } from "@/lib/api";
import { shellAccount } from "@/modules/workspace/data";
import { listeningLabEnabled, mockPilotPaymentsEnabled, readingLabEnabled, speakingLabEnabled, writingLabEnabled } from "@/lib/local-pilot";

// The mobile app's counterpart of the Workspace shell's server props: who is signed in, the active plans,
// the AI credit balance and which pilot features are switched on. Read-only; the same session checks as every API.
export async function GET(request: Request) {
  try {
    await apiUser(request);
    return privateJson({
      account: await shellAccount(),
      features: {
        speakingLab: speakingLabEnabled(), writingLab: writingLabEnabled(), listeningLab: listeningLabEnabled(),
        readingLab: readingLabEnabled(), payments: mockPilotPaymentsEnabled(),
      },
    });
  } catch (error) { return apiFailure(error); }
}
