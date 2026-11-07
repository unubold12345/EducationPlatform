import { renderToString } from "katex";

/** Convert legacy, plain-text option values for display only. Stored answers never change. */
export function optionTex(text: string): string {
  const powers: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-" };
  const index = (group: string) => [...group].map(char => powers[char]).join("");
  // A leading superscript marks a root index in the source (⁵√x); it must become \sqrt[5]{x},
  // because a bare ^{5} has no base and KaTeX rejects it.
  const nestedRoot = /^([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)√\(([\s\S]*)\)$/.exec(text);
  if (nestedRoot) return "\\sqrt[" + index(nestedRoot[1]) + "]{" + optionTex(nestedRoot[2]) + "}";
  const simpleRoot = /^([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)√([0-9A-Za-z]+)$/.exec(text);
  if (simpleRoot) return "\\sqrt[" + index(simpleRoot[1]) + "]{" + optionTex(simpleRoot[2]) + "}";
  return text.replaceAll("−", "-").replaceAll("π", "\\pi").replaceAll("∞", "\\infty").replaceAll("∪", "\\cup")
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, group => "^{" + index(group) + "}")
    .replace(/√\(([^()]*)\)/g, (_, inner: string) => "\\sqrt{" + optionTex(inner) + "}")
    .replace(/√(\d+)/g, "\\sqrt{$1}")
    .replace(/(-?\d+|\\pi)\/(\\sqrt\{\d+\}|\d+)/g, "\\dfrac{$1}{$2}")
    .replace(/;/g, ";\\,");
}

export function mathHtml(tex: string): string {
  return renderToString(tex, { throwOnError: true, trust: false, strict: "error", output: "htmlAndMathml", maxExpand: 200, maxSize: 12 });
}

export function mathSegments(text: string): { text: string; math: boolean }[] {
  if (!text.includes("$")) {
    text = text.replace(/\[\[([-\d]+),\s*([-\d]+)\],\s*\[([-\d]+),\s*([-\d]+)\]\]/g, (_, a, b, c, d) => `$\\begin{pmatrix}${a}&${b}\\\\${c}&${d}\\end{pmatrix}$`)
      .replace(/\(([A-Za-z\d²³⁴⁵⁻+−*· =]+)\)\/\(([A-Za-z\d²³⁴⁵⁻+−*· =]+)\)/g, (_, numerator: string, denominator: string) => `$\\dfrac{${optionTex(numerator)}}{${optionTex(denominator)}}$`);
  }
  // Explicit authoring handles full formulas; plain numeric fractions also work in old snapshots/explanations.
  return text.split(/(\$[^$]+\$|(?<![\p{L}\d])[-−]?\d+\/\d+(?![\p{L}\d]))/gu).filter(Boolean).map(part => ({
    text: part.startsWith("$") && part.endsWith("$") ? part.slice(1, -1) : part,
    math: part.startsWith("$") || /^[-−]?\d+\/\d+$/.test(part),
  }));
}
