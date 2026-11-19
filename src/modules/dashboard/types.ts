// Shapes the dashboard page passes from the server to its client parts.
export type GoalProgress = { mocks: number; free: boolean; finished: number; average: number | null; last: number | null; practice: number };

export type CreditEntry = { id: string; at: string; label: string; area: string; credits: number; status: "SPENT" | "REFUNDED" | "HELD"; yellow: boolean };

export type CreditOverview = {
  summary: { balance: number; allowance: number; used: number; yellow: number; resetsAt: string } | null;
  /** Credits spent on each of the last 30 Ulaanbaatar days, oldest first. */
  daily: { day: string; credits: number }[];
  /** This month's spent credits by area, largest first. */
  areas: { area: string; credits: number; count: number }[];
  monthSpent: number;
  purchases: { id: string; at: string; credits: number; amountMnt: number }[];
  entries: CreditEntry[]; next: string | null;
};
