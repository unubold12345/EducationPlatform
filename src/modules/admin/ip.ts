// Store IPv6 in its short form so "0000:...:0001" and "::1" group as the same address.
export function normalizeIp(value: string | null | undefined) {
  const ip = value?.trim();
  if (!ip || !ip.includes(":") || ip.includes(".") || ip.includes("::")) return ip ? ip.toLowerCase() : null;
  const groups = ip.toLowerCase().split(":").map(group => group.replace(/^0+(?=.)/, ""));
  let best = { at: -1, length: 0 };
  for (let i = 0; i < groups.length;) {
    if (groups[i] !== "0") { i++; continue; }
    let j = i; while (j < groups.length && groups[j] === "0") j++;
    if (j - i > best.length && j - i > 1) best = { at: i, length: j - i };
    i = j;
  }
  if (best.at < 0) return groups.join(":");
  return (groups.slice(0, best.at).join(":") + "::" + groups.slice(best.at + best.length).join(":")).replace(/^:::/, "::");
}
