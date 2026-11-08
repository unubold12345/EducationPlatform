// Splits an AI reply into paragraphs, headings and lists. Pure, so it can be unit-tested.
export type Block = { kind: "p"; text: string } | { kind: "h"; text: string } | { kind: "ul" | "ol"; items: string[]; start: number };
export function markdownBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  const flush = () => { if (paragraph.length) { blocks.push({ kind: "p", text: paragraph.join("\n") }); paragraph = []; } };
  for (const raw of source.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\s*(\d{1,3})[.)]\s+(.*)$/.exec(line);
    const heading = /^\s*#{1,4}\s+(.*)$/.exec(line);
    const last = blocks.at(-1);
    if (!line.trim()) { flush(); continue; }
    if (heading) { flush(); blocks.push({ kind: "h", text: heading[1].replace(/\*\*/g, "") }); continue; }
    if (bullet) {
      flush();
      if (last?.kind === "ul") last.items.push(bullet[1]); else blocks.push({ kind: "ul", items: [bullet[1]], start: 1 });
      continue;
    }
    if (numbered) {
      flush();
      if (last?.kind === "ol") last.items.push(numbered[2]); else blocks.push({ kind: "ol", items: [numbered[2]], start: Number(numbered[1]) });
      continue;
    }
    // An indented line right after a list item continues that item.
    if (!paragraph.length && (last?.kind === "ul" || last?.kind === "ol") && /^\s{2,}\S/.test(raw)) { last.items[last.items.length - 1] += "\n" + line.trim(); continue; }
    paragraph.push(line);
  }
  flush();
  return blocks;
}
