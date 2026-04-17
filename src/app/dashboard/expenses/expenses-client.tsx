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
    budget: "0",
    expenses: [],
  };
}

function normalizeFinanceRow(value: Partial<FinanceRow> | null | undefined): FinanceRow {
  if (!value) {
    return createDefaultFinanceRow();
  }

  return {
    budget: typeof value.budget === "string" ? value.budget : "0",
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
    budget: legacyBudget ?? "0",
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
  const [budget, setBudget] = useState("0");
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
        width: "100%",
        margin: 0,
        padding: "1.5rem 2rem",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 40, marginBottom: 4, fontWeight: "800", color: "#111827" }}>💰 Expenses</h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 15 }}>
            Track and manage your monthly expenses
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link
            href="/dashboard/analytics"
            style={{
              border: "none",
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              color: "#fff",
              borderRadius: 10,
              padding: "10px 16px",
              cursor: "pointer",
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.transform = "translateY(-2px)";
              (e.target as HTMLElement).style.boxShadow = "0 6px 16px rgba(59, 130, 246, 0.4)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.transform = "translateY(0)";
              (e.target as HTMLElement).style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3)";
            }}
          >
            📊 Charts
          </Link>
          <button
            onClick={logout}
            style={{
              border: "2px solid #e5e7eb",
              background: "#fff",
              color: "#111827",
              borderRadius: 10,
              padding: "10px 16px",
              cursor: "pointer",
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = "#f9fafb";
              (e.target as HTMLElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = "#fff";
              (e.target as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24, overflowY: "auto", paddingBottom: "1rem" }}>
      <section
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "2rem",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
          border: "1px solid #f0f0f0",
          flexShrink: 0,
        }}
      >
        <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 20, fontWeight: "700", color: "#111827" }}>Set Your Budget</h2>
        <div style={{ marginBottom: 0 }}>
          <label style={{ display: "block", marginBottom: 10, color: "#4b5563", fontSize: 14, fontWeight: "600" }}>
            Monthly Budget
          </label>
          <input
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            style={{
              width: "100%",
              maxWidth: 320,
              padding: "12px 16px",
              fontSize: "16px",
              border: "2px solid #e5e7eb",
              borderRadius: 10,
              background: "#fafafa",
              fontFamily: "inherit",
              transition: "all 0.3s ease",
            }}
            onFocus={(e) => {
              (e.target as HTMLElement).style.borderColor = "#3b82f6";
              (e.target as HTMLElement).style.background = "#fff";
              (e.target as HTMLElement).style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
            }}
            onBlur={(e) => {
              (e.target as HTMLElement).style.borderColor = "#e5e7eb";
              (e.target as HTMLElement).style.background = "#fafafa";
              (e.target as HTMLElement).style.boxShadow = "none";
            }}
          />
        </div>
      </section>

      <section
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "2rem",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
          border: "1px solid #f0f0f0",
          flexShrink: 0,
        }}
      >
        <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 20, fontWeight: "700", color: "#111827" }}>Add New Expense</h2>
        <form onSubmit={addExpense} style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "flex-end" }}>
            <div>
              <label style={{ display: "block", marginBottom: 8, color: "#4b5563", fontSize: 14, fontWeight: "600" }}>
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Coffee"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: "14px",
                  border: "2px solid #e5e7eb",
                  borderRadius: 10,
                  background: "#fafafa",
                  fontFamily: "inherit",
                  transition: "all 0.3s ease",
                }}
                onFocus={(e) => {
                  (e.target as HTMLElement).style.borderColor = "#3b82f6";
                  (e.target as HTMLElement).style.background = "#fff";
                  (e.target as HTMLElement).style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                }}
                onBlur={(e) => {
                  (e.target as HTMLElement).style.borderColor = "#e5e7eb";
                  (e.target as HTMLElement).style.background = "#fafafa";
                  (e.target as HTMLElement).style.boxShadow = "none";
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, color: "#4b5563", fontSize: 14, fontWeight: "600" }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: "14px",
                  border: "2px solid #e5e7eb",
                  borderRadius: 10,
                  background: "#fafafa",
                  fontFamily: "inherit",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, color: "#4b5563", fontSize: 14, fontWeight: "600" }}>
                Amount
              </label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: "14px",
                  border: "2px solid #e5e7eb",
                  borderRadius: 10,
                  background: "#fafafa",
                  fontFamily: "inherit",
                  transition: "all 0.3s ease",
                }}
                onFocus={(e) => {
                  (e.target as HTMLElement).style.borderColor = "#3b82f6";
                  (e.target as HTMLElement).style.background = "#fff";
                  (e.target as HTMLElement).style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                }}
                onBlur={(e) => {
                  (e.target as HTMLElement).style.borderColor = "#e5e7eb";
                  (e.target as HTMLElement).style.background = "#fafafa";
                  (e.target as HTMLElement).style.boxShadow = "none";
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 20px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                transition: "all 0.3s ease",
                fontSize: "14px",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.transform = "translateY(-2px)";
                (e.target as HTMLElement).style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.4)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.transform = "translateY(0)";
                (e.target as HTMLElement).style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
              }}
            >
              Add
            </button>
          </div>
        </form>
      </section>

      <section
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "2rem",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
          border: "1px solid #f0f0f0",
          flexShrink: 0,
        }}
      >
        <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 24, fontWeight: "700", color: "#111827" }}>Summary</h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div
            style={{
              background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
              padding: "1.5rem",
              borderRadius: 12,
              border: "1px solid #93c5fd",
            }}
          >
            <div style={{ color: "#1e40af", fontSize: 13, marginBottom: 6, fontWeight: "600" }}>Total Budget</div>
            <div style={{ fontSize: 24, fontWeight: "800", color: "#1e3a8a" }}>${budgetValue.toFixed(2)}</div>
          </div>
          <div
            style={{
              background: "linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)",
              padding: "1.5rem",
              borderRadius: 12,
              border: "1px solid #f87171",
            }}
          >
            <div style={{ color: "#991b1b", fontSize: 13, marginBottom: 6, fontWeight: "600" }}>Total Spent</div>
            <div style={{ fontSize: 24, fontWeight: "800", color: "#7f1d1d" }}>${total.toFixed(2)}</div>
          </div>
          <div
            style={{
              background: remaining < 0 
                ? "linear-gradient(135deg, #fca5a5 0%, #f87171 100%)"
                : "linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%)",
              padding: "1.5rem",
              borderRadius: 12,
              border: remaining < 0 ? "1px solid #f87171" : "1px solid #6ee7b7",
            }}
          >
            <div style={{ color: remaining < 0 ? "#991b1b" : "#065f46", fontSize: 13, marginBottom: 6, fontWeight: "600" }}>Remaining</div>
            <div style={{ fontSize: 24, fontWeight: "800", color: remaining < 0 ? "#7f1d1d" : "#047857" }}>
              ${remaining.toFixed(2)}
            </div>
          </div>
        </div>

        {Object.keys(byCategory).length > 0 && (
          <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "2px solid #f3f4f6" }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 14, fontWeight: "700", color: "#6b7280" }}>Breakdown by Category</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {Object.entries(byCategory).map(([cat, value]) => (
                <div key={cat} style={{
                  background: "#f9fafb",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                }}>
                  <span style={{ fontSize: 13, fontWeight: "600", color: "#111827" }}>
                    {cat}:
                  </span>
                  <span style={{ fontSize: 13, fontWeight: "700", color: "#3b82f6", marginLeft: 6 }}>
                    ${Number(value).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {expenses.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 1rem", color: "#9ca3af" }}>
            <p style={{ fontSize: 15 }}>No expenses yet. Add one to get started!</p>
          </div>
        ) : (
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 14, fontWeight: "700", color: "#6b7280" }}>Recent Expenses</h3>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
              {expenses.map((item) => (
                <li
                  key={item.id}
                  style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: "14px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "#f3f4f6";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "#f9fafb";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: "600", color: "#111827" }}>
                      {item.name}
                    </span>
                    <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 8 }}>
                      {item.category}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: "700", color: "#3b82f6" }}>
                      ${item.amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeExpense(item.id)}
                      style={{
                        border: "none",
                        background: "#fecaca",
                        color: "#991b1b",
                        borderRadius: 8,
                        padding: "6px 12px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "600",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLElement).style.background = "#f87171";
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLElement).style.background = "#fecaca";
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
      </div>

      {isSaving && (
        <div style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          background: "#111827",
          color: "#fff",
          padding: "12px 16px",
          borderRadius: 10,
          fontSize: 14,
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
        }}>
          ✓ Saving...
        </div>
      )}
    </main>
  );
}
