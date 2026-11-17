export const MOCK_PRICE_MNT = 10000;
export const MOCK_PRICE_LABEL = "₮10,000";
/** A one-time mock purchase opens that mock for this many days from payment (owner rule 2026-11-17). */
export const MOCK_PURCHASE_DAYS = 7;
export const MOCK_PURCHASE_MS = MOCK_PURCHASE_DAYS * 24 * 60 * 60 * 1000;
/** The price with its term, for the places that sell a single mock. */
export const MOCK_PRICE_TERM = `${MOCK_PRICE_LABEL} / ${MOCK_PURCHASE_DAYS} хоног`;
