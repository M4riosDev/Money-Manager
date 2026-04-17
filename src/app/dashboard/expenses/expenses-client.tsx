"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Expense = {
  id: string;
  name: string;
  amount: number;
  category: string;
};

type FinanceRow = {
  budget: string;
  expenses: Expense[];
};

const CATEGORIES = ["Food", "Bills", "Transport", "Shopping", "Health", "Other"];
const LEGACY_STORAGE_KEYS = [
  "money-manager-expenses",
  "money-manager-budget",
  "money-manager:budget",
  "money-manager:expenses",
];

function createDefaultFinanceRow(): FinanceRow {
  return {
    budget: "1500",
    expenses: [],
  };
}

function normalizeFinanceRow(value: Partial<FinanceRow> | null | undefined): FinanceRow {
  if (!value) {
    return createDefaultFinanceRow();
  }

  return {
    budget: typeof value.budget === "string" ? value.budget : "1500",
    expenses: Array.isArray(value.expenses)
      ? value.expenses.map((item) => ({
          id: typeof item?.id === "string" ? item.id : crypto.randomUUID(),
          name: typeof item?.name === "string" ? item.name : "",
          amount: Number(item?.amount) || 0,
          category: typeof item?.category === "string" ? item.category : "Other",
        }))
      : [],
  };
}

function readLegacyFinance(userId: string) {
  if (typeof window === "undefined") return null;

  const legacyBudget =
    localStorage.getItem(`money-manager:${userId}:budget`) ??
    localStorage.getItem("money-manager-budget");
  const legacyExpensesRaw =
    localStorage.getItem(`money-manager:${userId}:expenses`) ??
    localStorage.getItem("money-manager-expenses");

  let legacyExpenses: Expense[] | null = null;
  if (legacyExpensesRaw) {
    try {
      const parsed = JSON.parse(legacyExpensesRaw) as Expense[];
      legacyExpenses = Array.isArray(parsed) ? parsed : null;
    } catch {
      legacyExpenses = null;
    }
  }

  if (!legacyBudget && !legacyExpenses) return null;

  return normalizeFinanceRow({
    budget: legacyBudget ?? "1500",
    expenses: legacyExpenses ?? [],
  });
}

function clearLegacyFinance(userId: string) {
  if (typeof window === "undefined") return;

  localStorage.removeItem(`money-manager:${userId}:budget`);
  localStorage.removeItem(`money-manager:${userId}:expenses`);
  for (const key of LEGACY_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}

export default function ExpensesClient({ userId }: { userId: string }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [budget, setBudget] = useState("1500");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const total = useMemo(() => {
    return expenses.reduce((sum, item) => sum + item.amount, 0);
  }, [expenses]);

  const budgetValue = Number(budget) > 0 ? Number(budget) : 0;
  const remaining = budgetValue - total;

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of expenses) {
      map[item.category] = (map[item.category] || 0) + item.amount;
    }
    return map;
  }, [expenses]);

  useEffect(() => {
    let cancelled = false;

    async function loadFinance() {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("vaults")
        .select("budget, expenses")
        .eq("user_id", userId)
        .maybeSingle<FinanceRow>();

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      if (data) {
        const normalized = normalizeFinanceRow(data);
        setBudget(normalized.budget);
        setExpenses(normalized.expenses);
        clearLegacyFinance(userId);
        setLoading(false);
        return;
      }

      const legacyFinance = readLegacyFinance(userId) ?? createDefaultFinanceRow();
      setBudget(legacyFinance.budget);
      setExpenses(legacyFinance.expenses);

      const { error: insertError } = await supabase
        .from("vaults")
        .upsert(
          {
            user_id: userId,
            budget: legacyFinance.budget,
            expenses: legacyFinance.expenses,
          },
          { onConflict: "user_id" },
        );

      if (cancelled) return;

      if (insertError) {
        setError(insertError.message);
      } else {
        clearLegacyFinance(userId);
      }

      setLoading(false);
    }

    loadFinance().catch(() => {
      if (!cancelled) {
        setError("Unable to load finance data.");
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  useEffect(() => {
    if (loading || error) return;

    setIsSaving(true);
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          await supabase.from("vaults").upsert(
            {
              user_id: userId,
              budget,
              expenses,
            },
            { onConflict: "user_id" },
          );
        } finally {
          setIsSaving(false);
        }
      })();
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [budget, expenses, error, loading, supabase, userId]);

  function addExpense(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!name.trim() || !Number.isFinite(value) || value <= 0) return;

    setExpenses((prev) => [
      { id: crypto.randomUUID(), name: name.trim(), amount: value, category },
      ...prev,
    ]);
    setName("");
    setAmount("");
  }

  function removeExpense(id: string) {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "2rem 1rem",
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: 460,
            borderRadius: 14,
            border: "1px solid #e5e7eb",
            background: "#fff",
            padding: "1.5rem",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 30 }}>Loading dashboard</h1>
          <p style={{ marginTop: 8, marginBottom: 0, color: "#4b5563" }}>
            Fetching your finance data from Supabase.
          </p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "2rem 1rem",
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: 460,
            borderRadius: 14,
            border: "1px solid #e5e7eb",
            background: "#fff",
            padding: "1.5rem",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 30 }}>Dashboard error</h1>
          <p style={{ marginTop: 8, marginBottom: 0, color: "#b91c1c" }}>{error}</p>
        </section>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        maxWidth: 760,
        margin: "0 auto",
        padding: "2rem 1rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 34, marginBottom: 8 }}>Expenses</h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
            Track and manage your expenses
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link
            href="/dashboard/analytics"
            style={{
              border: "1px solid #3b82f6",
              background: "#dbeafe",
              color: "#1e40af",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            📊 Charts
          </Link>
          <button
            onClick={logout}
            style={{
              border: "1px solid #d1d5db",
              background: "#fff",
              color: "#111827",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <section
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "1rem",
          marginBottom: 16,
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6, color: "#4b5563", fontSize: 14 }}>
            Monthly budget
          </label>
          <input
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            type="number"
            min="0"
            step="0.01"
            placeholder="Your monthly budget"
            style={{ width: 220 }}
          />
        </div>

        <form onSubmit={addExpense} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Expense name"
            style={{ flex: 1, minWidth: 180 }}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: 140 }}
          >
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount"
            style={{ width: 140 }}
          />
          <button
            type="submit"
            style={{
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </form>
      </section>

      <section
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "1rem",
        }}
      >
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
          <div style={{ fontWeight: 700 }}>Budget: ${budgetValue.toFixed(2)}</div>
          <div style={{ fontWeight: 700 }}>Spent: ${total.toFixed(2)}</div>
          <div style={{ fontWeight: 700, color: remaining < 0 ? "#b91c1c" : "#065f46" }}>
            Left: ${remaining.toFixed(2)}
          </div>
          {isSaving ? <div style={{ color: "#6b7280", fontSize: 14 }}>Saving...</div> : null}
        </div>

        {Object.keys(byCategory).length > 0 && (
          <div style={{ marginBottom: 12, color: "#4b5563", fontSize: 14 }}>
            {Object.entries(byCategory).map(([cat, value]) => (
              <span key={cat} style={{ marginRight: 12 }}>
                {cat}: ${value.toFixed(2)}
              </span>
            ))}
          </div>
        )}

        {expenses.length === 0 ? (
          <p style={{ color: "#6b7280" }}>No expenses yet.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
            {expenses.map((item) => (
              <li
                key={item.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: "10px 12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span>
                  {item.name} ({item.category}) - ${item.amount.toFixed(2)}
                </span>
                <button
                  onClick={() => removeExpense(item.id)}
                  style={{
                    border: "1px solid #fecaca",
                    background: "#fef2f2",
                    color: "#b91c1c",
                    borderRadius: 8,
                    padding: "6px 10px",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
