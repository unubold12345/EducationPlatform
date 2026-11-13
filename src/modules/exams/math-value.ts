// Typed mathematics answers are compared by value, so equal forms are equal: (x−4)(x−1) and x²−5x+4,
// π and 6π/6, 7√3 and 21√3/3, 60 and 60°, y=x/2+4 and x−2y+8=0. A small recursive-descent parser reads
// what students type (Unicode or ASCII); nothing is passed to eval. Lists, intervals, sets, inequalities
// and anything else it cannot read give null, and the caller keeps its string comparison.

type Node =
  | { t: "num"; v: number }
  | { t: "var"; n: string }
  | { t: "neg"; a: Node }
  | { t: "op"; o: "+" | "-" | "*" | "/" | "^"; a: Node; b: Node }
  | { t: "fn"; f: string; a: Node; base?: number }
  | { t: "root"; n: number; a: Node }
  | { t: "fact"; a: Node };
type Token =
  | { k: "num"; v: number }
  | { k: "var"; n: string }
  | { k: "fn"; f: string; base?: number }
  | { k: "root"; n: number }
  | { k: "op"; o: string };

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const SUB = "₀₁₂₃₄₅₆₇₈₉";
// Longer names first, so "arcsin" is not read as "arc" + "sin" and "ctg" before "tg".
const FUNCTIONS = ["arcsin", "arccos", "arctan", "sqrt", "cbrt", "sin", "cos", "tan", "cot", "ctg", "tg", "exp", "ln", "lg", "log"];
const MAX_LENGTH = 160;

class Unreadable extends Error {}

function tokenize(input: string): Token[] {
  const text = input.toLowerCase()
    .replace(/[−–—]/g, "-").replace(/\*\*/g, "^").replace(/[×·∗•⋅]/g, "*").replace(/÷/g, "/").replace(/°/g, "")
    .replace(/[[{]/g, "(").replace(/[\]}]/g, ")").replace(/\s+/g, "");
  const out: Token[] = [];
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    if (/[0-9.]/.test(char)) {
      const match = /^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/.exec(text.slice(i));
      if (!match) throw new Unreadable();
      out.push({ k: "num", v: Number(match[0]) });
      i += match[0].length;
      continue;
    }
    if (SUP.includes(char) || char === "⁻" || char === "⁺") {
      let digits = "";
      while (i < text.length && (SUP.includes(text[i]) || text[i] === "⁻" || text[i] === "⁺")) {
        digits += text[i] === "⁻" ? "-" : text[i] === "⁺" ? "+" : String(SUP.indexOf(text[i]));
        i++;
      }
      // A leading superscript before a root sign is the root's index: ⁵√x.
      if (text[i] === "√") {
        const index = Number(digits);
        if (!Number.isInteger(index) || index < 2) throw new Unreadable();
        out.push({ k: "root", n: index });
        i++;
        continue;
      }
      if (!/^[+-]?\d+$/.test(digits)) throw new Unreadable();
      out.push({ k: "op", o: "^" });
      if (digits.startsWith("-")) out.push({ k: "op", o: "(" }, { k: "op", o: "-" }, { k: "num", v: Number(digits.slice(1)) }, { k: "op", o: ")" });
      else out.push({ k: "num", v: Number(digits.replace("+", "")) });
      continue;
    }
    if (char === "√" || char === "∛" || char === "∜") { out.push({ k: "root", n: char === "√" ? 2 : char === "∛" ? 3 : 4 }); i++; continue; }
    if (char === "π") { out.push({ k: "num", v: Math.PI }); i++; continue; }
    if (/[a-z]/.test(char)) {
      const rest = text.slice(i);
      const name = FUNCTIONS.find(item => rest.startsWith(item));
      if (name) {
        i += name.length;
        let base: number | undefined;
        if (name === "log") {
          let digits = "";
          while (i < text.length && SUB.includes(text[i])) digits += String(SUB.indexOf(text[i++]));
          const ascii = !digits ? /^_(\d+(?:\.\d+)?)/.exec(text.slice(i)) : null;
          if (ascii) { digits = ascii[1]; i += ascii[0].length; }
          if (digits) base = Number(digits);
        }
        out.push({ k: "fn", f: name, base });
        continue;
      }
      if (rest.startsWith("pi")) { out.push({ k: "num", v: Math.PI }); i += 2; continue; }
      // Euler's number; any other single letter is a variable (2xy is 2·x·y).
      out.push(char === "e" ? { k: "num", v: Math.E } : { k: "var", n: char });
      i++;
      continue;
    }
    if ("+-*/^()!".includes(char)) { out.push({ k: "op", o: char }); i++; continue; }
    throw new Unreadable();
  }
  return out;
}

class Parser {
  private index = 0;
  private readonly tokens: Token[];
  // No parameter properties: unit tests load this file with Node's type stripping.
  constructor(tokens: Token[]) { this.tokens = tokens; }
  parse(): Node {
    const node = this.expression();
    if (this.index !== this.tokens.length) throw new Unreadable();
    return node;
  }
  private peek() { return this.tokens[this.index]; }
  private isOp(op: string) { const token = this.peek(); return token?.k === "op" && token.o === op; }
  private take() { const token = this.tokens[this.index++]; if (!token) throw new Unreadable(); return token; }
  private takeOp() { const token = this.take(); if (token.k !== "op") throw new Unreadable(); return token.o; }
  private startsFactor(withFunctions = true) {
    const token = this.peek();
    if (!token) return false;
    if (token.k === "op") return token.o === "(";
    return withFunctions || token.k !== "fn";
  }
  private expression(): Node {
    let node = this.term();
    while (this.isOp("+") || this.isOp("-")) {
      const op = this.takeOp() as "+" | "-";
      node = { t: "op", o: op, a: node, b: this.term() };
    }
    return node;
  }
  // Implicit multiplication binds like × and ÷, left to right: 256/3π is (256/3)·π.
  private term(): Node {
    let node = this.unary();
    for (;;) {
      if (this.isOp("*") || this.isOp("/")) {
        const op = this.takeOp() as "*" | "/";
        node = { t: "op", o: op, a: node, b: this.unary() };
      } else if (this.startsFactor()) node = { t: "op", o: "*", a: node, b: this.power() };
      else return node;
    }
  }
  private unary(): Node {
    if (this.isOp("-")) { this.take(); return { t: "neg", a: this.unary() }; }
    if (this.isOp("+")) { this.take(); return this.unary(); }
    return this.power();
  }
  private power(): Node {
    const base = this.postfix();
    if (this.isOp("^")) { this.take(); return { t: "op", o: "^", a: base, b: this.unary() }; }
    return base;
  }
  private postfix(): Node {
    let node = this.primary();
    while (this.isOp("!")) { this.take(); node = { t: "fact", a: node }; }
    return node;
  }
  private primary(): Node {
    const token = this.take();
    if (token.k === "num") return { t: "num", v: token.v };
    if (token.k === "var") return { t: "var", n: token.n };
    if (token.k === "root") return { t: "root", n: token.n, a: this.power() };
    if (token.k === "fn") return { t: "fn", f: token.f, base: token.base, a: this.argument() };
    if (token.o === "(") {
      const inner = this.expression();
      if (!this.isOp(")")) throw new Unreadable();
      this.take();
      return inner;
    }
    throw new Unreadable();
  }
  // sin(2x), sin2x and ln3 take the product that follows; a further function starts a new factor (sinx·cosx).
  private argument(): Node {
    if (this.isOp("(")) return this.power();
    let node = this.power();
    while (this.startsFactor(false)) node = { t: "op", o: "*", a: node, b: this.power() };
    return node;
  }
}

function variables(node: Node, into = new Set<string>()): Set<string> {
  if (node.t === "var") into.add(node.n);
  else if (node.t === "op") { variables(node.a, into); variables(node.b, into); }
  else if (node.t !== "num") variables(node.a, into);
  return into;
}

function factorial(value: number) {
  if (!Number.isInteger(value) || value < 0 || value > 170) return NaN;
  let result = 1;
  for (let i = 2; i <= value; i++) result *= i;
  return result;
}

function evaluate(node: Node, scope: Record<string, number>): number {
  switch (node.t) {
    case "num": return node.v;
    case "var": return scope[node.n] ?? NaN;
    case "neg": return -evaluate(node.a, scope);
    case "fact": return factorial(evaluate(node.a, scope));
    case "root": {
      const value = evaluate(node.a, scope);
      if (node.n % 2 === 1) return Math.sign(value) * Math.abs(value) ** (1 / node.n);
      return value < 0 ? NaN : value ** (1 / node.n);
    }
    case "op": {
      const a = evaluate(node.a, scope), b = evaluate(node.b, scope);
      if (node.o === "+") return a + b;
      if (node.o === "-") return a - b;
      if (node.o === "*") return a * b;
      if (node.o === "/") return a / b;
      return a < 0 && !Number.isInteger(b) ? NaN : a ** b;
    }
    case "fn": {
      const a = evaluate(node.a, scope);
      switch (node.f) {
        case "sqrt": return a < 0 ? NaN : Math.sqrt(a);
        case "cbrt": return Math.cbrt(a);
        case "sin": return Math.sin(a);
        case "cos": return Math.cos(a);
        case "tan": case "tg": return Math.tan(a);
        case "cot": case "ctg": return 1 / Math.tan(a);
        case "arcsin": return Math.asin(a);
        case "arccos": return Math.acos(a);
        case "arctan": return Math.atan(a);
        case "exp": return Math.exp(a);
        case "ln": return a <= 0 ? NaN : Math.log(a);
        case "lg": return a <= 0 ? NaN : Math.log10(a);
        default: return a <= 0 ? NaN : node.base ? Math.log(a) / Math.log(node.base) : Math.log10(a);
      }
    }
  }
}

type Reading = { equation: boolean; node: Node; vars: Set<string> };
function read(text: string): Reading | null {
  if (!text.trim() || text.length > MAX_LENGTH) return null;
  const sides = text.split("=");
  if (sides.length > 2 || /[<>≤≥≠;,|]/.test(text)) return null;
  try {
    const nodes = sides.map(side => new Parser(tokenize(side)).parse());
    // An equation L = R is read as L − R = 0.
    const node: Node = nodes.length === 2 ? { t: "op", o: "-", a: nodes[0], b: nodes[1] } : nodes[0];
    return { equation: nodes.length === 2, node, vars: variables(node) };
  } catch (error) {
    if (error instanceof Unreadable || error instanceof RangeError) return null;
    throw error;
  }
}

// Spread over negatives, fractions and larger values, so roots such as √(x−3) still have several valid points.
const SAMPLES = [0.731, 1.618, 2.414, -0.577, 3.302, -1.414, 0.259, 4.123, 1.205, -2.236, 5.871, 7.389, 9.142, 12.566, 17.321, 25.133];
const near = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

/** True when both answers name the same value, expression or equation; null when either cannot be read. */
export function sameMathValue(expected: string, given: string): boolean | null {
  const left = read(expected), right = read(given);
  if (!left || !right) return null;
  if (left.equation !== right.equation) return false;
  if (left.vars.size !== right.vars.size || [...left.vars].some(name => !right.vars.has(name))) return false;
  const names = [...left.vars].sort();
  const points = names.length
    ? SAMPLES.map((_, point) => Object.fromEntries(names.map((name, j) => [name, SAMPLES[(point + 3 * j) % SAMPLES.length] + 0.0137 * j])))
    : [{}];
  let ratio: number | null = null;
  let compared = 0;
  for (const scope of points) {
    const a = evaluate(left.node, scope), b = evaluate(right.node, scope);
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    if (!left.equation) {
      if (!near(a, b)) return false;
    } else {
      // Equations are equal when one side-difference is a constant non-zero multiple of the other.
      if (near(a, 0) && near(b, 0)) { compared++; continue; }
      if (near(b, 0) || near(a, 0)) return false;
      if (ratio === null) ratio = a / b;
      else if (!near(a, ratio * b)) return false;
    }
    compared++;
  }
  return compared >= (names.length ? 3 : 1) && (!left.equation || ratio !== null);
}
