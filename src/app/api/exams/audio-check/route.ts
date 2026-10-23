import { readFile } from "node:fs/promises";
import path from "node:path";
export async function GET() {
  const data=await readFile(path.join(process.cwd(),"assets","exams","audio-check.mp3"));
  return new Response(data,{headers:{"Content-Type":"audio/mpeg","Cache-Control":"public, max-age=86400"}});
}
