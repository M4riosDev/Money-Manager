export type IncomeMode = "fixed" | "self_employed";

type IncomeFields = {
  budget?: number | string | null;
  monthly_income?: number | string | null;
  extra_income?: number | string | null;
};

function toNonNegativeNumber(value: number | string | null | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return parsed;
}

export function normalizeIncomeMode(value: unknown): IncomeMode {
  return value === "self_employed" ? "self_employed" : "fixed";
}

export function resolveEffectiveIncome(values: IncomeFields): number {
  const monthlyIncome = toNonNegativeNumber(values.monthly_income);
  const fallbackBudget = toNonNegativeNumber(values.budget);
  const baseIncome = monthlyIncome > 0 ? monthlyIncome : fallbackBudget;
  const extraIncome = toNonNegativeNumber(values.extra_income);
  return baseIncome + extraIncome;
}
