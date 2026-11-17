import { ApiError, apiFailure, apiUser, privateJson } from "@/lib/api";
import { readingLabEnabled } from "@/lib/local-pilot";
import { publicGroups } from "@/modules/reading-lab/contracts";
import { readingSamples } from "@/modules/reading-lab/samples";
import { readingLibrary } from "@/modules/reading-lab/service";

// The mobile app's counterpart of /labs/ielts-reading's server props: the student's saved practices and their
// progress on the built-in samples, read by the page's own loader behind the page's own pilot switch.
// The website ships the five samples (with their key) in its page bundle; the app has no bundle of this site,
// so it gets the samples here, answer-free. A sample is marked by PATCH /api/labs/ielts-reading/samples/[id],
// which returns the key with the result, exactly as for a signed-in student on the website. Read-only.
export async function GET(request: Request) {
  try {
    const user = await apiUser(request);
    if (!readingLabEnabled()) throw new ApiError(404, "Туршилтын хуудас идэвхгүй байна.");
    const library = await readingLibrary(user.id);
    return privateJson({
      samples: readingSamples.map(sample => ({
        id: sample.id, title: sample.title, topic: sample.topic, level: sample.level, summary: sample.summary,
        paragraphs: sample.paragraphs, groups: publicGroups(sample.groups),
      })),
      practices: library.practices,
      sampleStates: library.samples,
    });
  } catch (error) { return apiFailure(error); }
}
