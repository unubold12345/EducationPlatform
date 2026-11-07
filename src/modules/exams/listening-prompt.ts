// Display-only split of generated IELTS Listening prompts (Mocks 02–06 use
// "Part N · Title\nLabel: Instruction") so the title and instruction show once per part
// instead of on every question. Prompts in any other shape pass through unchanged.
const INSTRUCTION = /^([\s\S]*?):\s*((?:Complete the notes|Choose ONE answer)\.[\s\S]*)$/;

export type ListeningPrompt = { title: string | null; text: string; instruction: string | null };

export function splitListeningPrompt(prompt: string): ListeningPrompt {
  const newline = prompt.indexOf("\n");
  const head = newline >= 0 ? prompt.slice(0, newline).trim() : null;
  const body = newline >= 0 ? prompt.slice(newline + 1).trim() : prompt;
  const match = INSTRUCTION.exec(body);
  return {
    title: head ? head.replace(/^Part \d+\s*·\s*/, "") : null,
    text: match ? match[1].trim() : body,
    instruction: match ? match[2].trim() : null,
  };
}

/** Heading text and the distinct instructions for one part's prompts. */
export function listeningPartInfo(prompts: string[]) {
  const parsed = prompts.map(splitListeningPrompt);
  return { title: parsed.find(p => p.title)?.title ?? null, instructions: [...new Set(parsed.map(p => p.instruction).filter((i): i is string => !!i))], parsed };
}
