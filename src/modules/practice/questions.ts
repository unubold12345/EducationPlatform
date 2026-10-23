export type PracticeQuestion = { id: string; prompt: string; options: string[] };
export const questions: PracticeQuestion[] = [
  { id: "demo-algebra-001-v1", prompt: "If 3x + 7 = 22, what is the value of x?", options: ["3", "5", "7", "9"] },
  { id: "demo-algebra-002-v1", prompt: "A line has the equation y = 4x - 3. What is the value of y when x = 2?", options: ["1", "4", "5", "8"] },
  { id: "demo-algebra-003-v1", prompt: "A notebook costs 4 dollars. A student buys n notebooks and pays a delivery fee of 3 dollars. Which expression represents the total cost, in dollars?", options: ["4(n + 3)", "3n + 4", "4n - 3", "4n + 3"] },
];
export type PracticeResult = { score: number; total: number; reviews: { id: string; selected: number; correct: number; explanation: string }[] };

