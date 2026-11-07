// Fingerprint of what a drill's recording says. The generator stores it in timings.json; the unit test
// recomputes it so an edited script cannot ship with stale audio.
import {createHash} from "node:crypto";
import {recordingLines,type ListeningDrill} from "./drills.ts";

export function drillAudioKey(drill:ListeningDrill){
 return createHash("sha256").update(JSON.stringify(recordingLines(drill).map(line=>[line.voice,line.say??line.text,line.pauseAfter??0]))).digest("hex").slice(0,16);
}
