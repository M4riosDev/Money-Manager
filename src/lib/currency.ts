export const SUPPORTED_CURRENCIES = [
  "EUR",
  "USD",
  "GBP",
  "CHF",
  "AUD",
  "CAD",
  "JPY",
  "BGN",
  "RON",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: SupportedCurrency = "EUR";

export function normalizeCurrency(input: unknown): SupportedCurrency {
  if (typeof input !== "string") return DEFAULT_CURRENCY;
  const upper = input.trim().toUpperCase();
  if ((SUPPORTED_CURRENCIES as readonly string[]).includes(upper)) {
    return upper as SupportedCurrency;
  }
  return DEFAULT_CURRENCY;
}

export function formatMoney(amount: number, currency: string): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const safeCurrency = normalizeCurrency(currency);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: safeCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
}
