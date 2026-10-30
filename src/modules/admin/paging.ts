// Pure pagination math for admin tables: clamps the page and returns a short window of page links.
export const PAGE_SIZE = 20;
export function parsePage(value: unknown) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? Math.min(page, 100000) : 1;
}
export function pageInfo(total: number, requested: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(total / size));
  const page = Math.min(Math.max(1, requested), pages);
  return { page, pages, size, skip: (page - 1) * size, from: total ? (page - 1) * size + 1 : 0, to: Math.min(total, page * size), total };
}
// First, last and up to two neighbours around the current page, with null marking a gap.
export function pageWindow(page: number, pages: number): (number | null)[] {
  const wanted = [...new Set([1, page - 2, page - 1, page, page + 1, page + 2, pages])].filter(n => n >= 1 && n <= pages).sort((a, b) => a - b);
  return wanted.flatMap((n, i) => i && n - wanted[i - 1] > 1 ? [null, n] : [n]);
}
