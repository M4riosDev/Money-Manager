import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

  const { budget, savings, expenses } = body as Record<string, unknown>;

  const budgetNum = Number(budget);
  if (!Number.isFinite(budgetNum) || budgetNum < 0 || budgetNum > MAX_BUDGET)
    return err(`budget must be a number between 0 and ${MAX_BUDGET}`);

  const savingsNum = Number(savings ?? 0);
  if (!Number.isFinite(savingsNum) || savingsNum < 0 || savingsNum > budgetNum)
    return err(`savings must be a number between 0 and the budget (${budgetNum})`);

  let cleanExpenses: ReturnType<typeof validateExpenses>;
  try {
    cleanExpenses = validateExpenses(expenses);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Invalid expenses");
  }

  const { error: dbErr } = await supabase
    .from("vaults")
    .upsert(
      {
        user_id:  user.id,
        budget:   budgetNum,
        savings:  savingsNum,
        expenses: cleanExpenses,
      },
      { onConflict: "user_id" }
    );

  if (dbErr) return err(dbErr.message, 500);

  return NextResponse.json({ ok: true });
}
