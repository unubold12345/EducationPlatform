// Pure configuration contract; production hosting requires an explicit pilot opt-in.
type PilotEnv=Record<string,string|undefined>;
export function pilotConfig(env:PilotEnv){
 let origin:URL;
 try{origin=new URL(env.BETTER_AUTH_URL??"");}catch{return {local:false,hosted:false,payments:false,speaking:false};}
 const loopback=["localhost","127.0.0.1","[::1]"].includes(origin.hostname);
 const clean=!origin.username&&!origin.password&&origin.pathname==="/"&&!origin.search&&!origin.hash;
 const local=clean&&loopback&&env.AUTH_LOCAL_PILOT==="true";
 const hosted=clean&&!loopback&&origin.protocol==="https:"&&env.AUTH_HOSTED_PILOT==="true";
 return {local,hosted,payments:local||(hosted&&env.HOSTED_MOCK_PAYMENTS==="true"),speaking:local||(hosted&&env.SPEAKING_LAB_ENABLED==="true")};
}
