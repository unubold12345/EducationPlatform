const listeningFiles:Record<string,string>={
  "ielts-academic-01":"ielts-01",
  "ielts-academic-02":"ielts-02",
  "ielts-academic-03":"ielts-03",
  "ielts-academic-04":"ielts-04",
  "ielts-academic-05":"ielts-05",
  "ielts-academic-06":"ielts-06",
};
// Exact allowlist keeps user input out of filesystem paths. Existing snapshots retain Mock 01 audio.
export function listeningFile(slug:string,part:number):string|undefined {
  const prefix=Object.hasOwn(listeningFiles,slug)?listeningFiles[slug]:undefined;
  return prefix&&Number.isInteger(part)&&part>=1&&part<=4?`${prefix}-part-${part}.mp3`:undefined;
}
