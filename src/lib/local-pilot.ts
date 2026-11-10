import "server-only";
import {pilotConfig} from "./pilot-config";
export function localPilotEnabled() {
 return pilotConfig(process.env).local;
}
export function hostedPilotEnabled(){return pilotConfig(process.env).hosted;}
export function mockPilotPaymentsEnabled(){return pilotConfig(process.env).payments;}
export function speakingLabEnabled(){return pilotConfig(process.env).speaking;}
// Workshop labs share the speaking pilot switch, so hosted rollout stays one explicit opt-in.
export function writingLabEnabled(){return pilotConfig(process.env).speaking;}
export function listeningLabEnabled(){return pilotConfig(process.env).speaking;}
export function readingLabEnabled(){return pilotConfig(process.env).speaking;}
// Local development only (DEV_PRACTICE_DURING_MOCK=true with the local pilot); always false when hosted.
export function practiceDuringMockAllowed(){return pilotConfig(process.env).practiceDuringMock;}
