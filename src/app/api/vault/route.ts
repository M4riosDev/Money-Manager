import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { normalizeCurrency } from "@/lib/currency";

// ── Constants ────────────────────────────────────────────────────────────────
const MAX_EXPENSES       = 500;
const MAX_NAME_LENGTH    = 100;
const MAX_AMOUNT         = 1_000_000;
const MAX_BUDGET         = 10_000_000;
const VALID_CATEGORIES   = new Set(["Food","Bills","Transport","Shopping","Health","Other"]);

interface RawExpense {
  id: unknown;
  name: unknown;
  amount: unknown;
  category: unknown;
}
function err(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

function validateExpenses(raw: unknown): { id: string; name: string; amount: number; category: string }[] {
  if (!Array.isArray(raw)) throw new Error("expenses must be an array");
  if (raw.length > MAX_EXPENSES) throw new Error(`Too many expenses (max ${MAX_EXPENSES})`);

  return raw.map((item: RawExpense, idx: number) => {
    if (!item || typeof item !== "object") throw new Error(`expenses[${idx}] is not an object`);

    const id       = item.id;
    const name     = item.name;
    const amount   = item.amount;
    const category = item.category;

    if (typeof id !== "string" || !/^[0-9a-f-]{36}$/.test(id))
      throw new Error(`expenses[${idx}].id must be a UUID`);

    if (typeof name !== "string" || name.trim() === "")
      throw new Error(`expenses[${idx}].name is required`);
    if (name.length > MAX_NAME_LENGTH)
      throw new Error(`expenses[${idx}].name too long (max ${MAX_NAME_LENGTH} chars)`);

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0 || amt > MAX_AMOUNT)
      throw new Error(`expenses[${idx}].amount must be a positive number ≤ ${MAX_AMOUNT}`);

    if (!VALID_CATEGORIES.has(String(category)))
      throw new Error(`expenses[${idx}].category is not a valid category`);

    return { id, name: name.trim(), amount: amt, category: String(category) };
  });
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return err("Unauthorized", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON");
  }

  if (!body || typeof body !== "object" || Array.isArray(body))
    return err("Body must be a JSON object");

  const { budget, savings, expenses, currency, saving_goals } = body as Record<string, unknown>;

  const budgetNum = Number(budget);
  if (!Number.isFinite(budgetNum) || budgetNum < 0 || budgetNum > MAX_BUDGET)
    return err(`budget must be a number between 0 and ${MAX_BUDGET}`);

  const savingsNum = Number(savings ?? 0);
  if (!Number.isFinite(savingsNum) || savingsNum < 0)
    return err(`savings must be a non-negative number`);

  let cleanExpenses: ReturnType<typeof validateExpenses>;
  try {
    cleanExpenses = validateExpenses(expenses);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Invalid expenses");
  }

  const cleanCurrency = normalizeCurrency(currency);

  const MAX_GOALS = 20;
  const MAX_GOAL_NAME = 60;
  let cleanGoals: { id: string; name: string; target: number; saved: number; icon: string; color: string }[] = [];
  if (Array.isArray(saving_goals)) {
    if (saving_goals.length > MAX_GOALS) return err(`Too many goals (max ${MAX_GOALS})`);
    try {
      cleanGoals = saving_goals.map((g: Record<string, unknown>, idx: number) => {
        if (!g || typeof g !== "object") throw new Error(`saving_goals[${idx}] is not an object`);
        const id = typeof g.id === "string" && /^[0-9a-f-]{36}$/.test(g.id) ? g.id : (() => { throw new Error(`saving_goals[${idx}].id invalid`); })();
        const name = typeof g.name === "string" && g.name.trim().length > 0 && g.name.length <= MAX_GOAL_NAME ? g.name.trim() : (() => { throw new Error(`saving_goals[${idx}].name invalid`); })();
        const target = Number(g.target);
        const saved  = Number(g.saved);
        if (!Number.isFinite(target) || target < 0) throw new Error(`saving_goals[${idx}].target invalid`);
        if (!Number.isFinite(saved)  || saved  < 0) throw new Error(`saving_goals[${idx}].saved invalid`);
        const icon  = typeof g.icon  === "string" ? g.icon.slice(0, 4)  : "🎯";
        const color = typeof g.color === "string" ? g.color.slice(0, 20) : "#3b82f6";
        return { id, name, target, saved, icon, color };
      });
    } catch (e) {
      return err(e instanceof Error ? e.message : "Invalid saving_goals");
    }
  }

  const { error: dbErr } = await supabase
    .from("vaults")
    .upsert(
      {
        user_id:      user.id,
        budget:       budgetNum,
        savings:      savingsNum,
        currency:     cleanCurrency,
        expenses:     cleanExpenses,
        saving_goals: cleanGoals,
      },
      { onConflict: "user_id" }
    );

  if (dbErr) return err(dbErr.message, 500);

  return NextResponse.json({ ok: true });
}
