import "server-only";
import {pilotConfig} from "./pilot-config";
export function localPilotEnabled() {
 return pilotConfig(process.env).local;
}
export function hostedPilotEnabled(){return pilotConfig(process.env).hosted;}
export function mockPilotPaymentsEnabled(){return pilotConfig(process.env).payments;}
export function speakingLabEnabled(){return pilotConfig(process.env).speaking;}
