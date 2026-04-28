"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_CURRENCY, formatMoney, normalizeCurrency, type SupportedCurrency } from "@/lib/currency";

type Expense = { id: string; name: string; amount: number; category: string };
type FinanceRow = {
  budget: number | string | null;
  monthly_income?: number | string | null;
  savings: number | string | null;
  currency: string | null;
  expenses: Expense[];
};
type NormalizedFinanceRow = { budget: number; savings: number; currency: SupportedCurrency; expenses: Expense[] };

const CATEGORIES = ["Food", "Bills", "Transport", "Shopping", "Health", "Other"];
const LEGACY_KEYS = ["money-manager-expenses","money-manager-budget","money-manager:budget","money-manager:expenses"];
const CAT_COLORS: Record<string, string> = {
  Food: "#3b82f6", Bills: "#ef4444", Transport: "#8b5cf6",
  Shopping: "#f59e0b", Health: "#10b981", Other: "#6b7280",
};


const MAX_SAVES = 20;
const WINDOW_MS = 60_000;

function useRateLimiter() {
  const timestamps = useRef<number[]>([]);
  return useCallback(() => {
    const now = Date.now();
    timestamps.current = timestamps.current.filter(t => now - t < WINDOW_MS);
    if (timestamps.current.length >= MAX_SAVES) return false;
    timestamps.current.push(now);
    return true;
  }, []);
}

function normalizeRow(v: Partial<FinanceRow> | null | undefined): NormalizedFinanceRow {
  if (!v) return { budget: 0, savings: 0, currency: DEFAULT_CURRENCY, expenses: [] };
  const normalizedBudget = Number(v.monthly_income) > 0 ? Number(v.monthly_income) : Number(v.budget);
  return {
    budget:  Number.isFinite(normalizedBudget) && normalizedBudget > 0 ? normalizedBudget : 0,
    savings: Number(v.savings) > 0 ? Math.min(Number(v.savings), Number.isFinite(normalizedBudget) ? normalizedBudget : 0) : 0,
    currency: normalizeCurrency(v.currency),
    expenses: Array.isArray(v.expenses) ? v.expenses.map(i => ({
      id:       typeof i?.id       === "string" ? i.id       : crypto.randomUUID(),
      name:     typeof i?.name     === "string" ? i.name     : "",
      amount:   Number(i?.amount)  || 0,
      category: typeof i?.category === "string" ? i.category : "Other",
    })) : [],
  };
}

function readLegacy(userId: string): NormalizedFinanceRow | null {
  if (typeof window === "undefined") return null;
  const b    = localStorage.getItem(`money-manager:${userId}:budget`) ?? localStorage.getItem("money-manager-budget");
  const eRaw = localStorage.getItem(`money-manager:${userId}:expenses`) ?? localStorage.getItem("money-manager-expenses");
  const sRaw = localStorage.getItem(`money-manager:${userId}:savings`);
  if (!b && !eRaw) return null;
  let e: Expense[] | null = null;
  try { const p = JSON.parse(eRaw ?? ""); e = Array.isArray(p) ? p : null; } catch { e = null; }
  return normalizeRow({ budget: Number(b) || 0, savings: Number(sRaw) || 0, currency: DEFAULT_CURRENCY, expenses: e ?? [] });
}

function clearLegacy(userId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`money-manager:${userId}:budget`);
  localStorage.removeItem(`money-manager:${userId}:expenses`);
  localStorage.removeItem(`money-manager:${userId}:savings`);
  LEGACY_KEYS.forEach(k => localStorage.removeItem(k));
}

async function saveVault(budget: number, savings: number, currency: SupportedCurrency, expenses: Expense[]) {
  const res = await fetch("/api/vault", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ budget, savings, currency, expenses }),
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error ?? "Save failed");
  }
}

export default function ExpensesClient({ userId }: { userId: string }) {
  const [supabase] = useState(() => createClient());
  const canSave  = useRateLimiter();

  const [budget,   setBudget]   = useState(0);
  const [savings,  setSavings]  = useState(0);
  const [currency, setCurrency] = useState<SupportedCurrency>(DEFAULT_CURRENCY);
  const [name,     setName]     = useState("");
  const [amount,   setAmount]   = useState("");
  const [category, setCategory] = useState("Food");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const total          = useMemo(() => expenses.reduce((s, i) => s + i.amount, 0), [expenses]);
  const budgetValue    = budget > 0 ? budget : 0;
  const savingsValue   = savings > 0 ? Math.min(savings, budgetValue) : 0;
  const spendableBudget = Math.max(0, budgetValue - savingsValue);
  const remaining      = spendableBudget - total;
  const pct            = spendableBudget > 0 ? Math.min(100, (total / spendableBudget) * 100) : 0;

  const byCategory = useMemo(() => {
    const m: Record<string, number> = {};
    expenses.forEach(i => { m[i.category] = (m[i.category] || 0) + i.amount; });
    return m;
  }, [expenses]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError("");
      const { data, error: e } = await supabase
        .from("vaults")
        .select("budget, monthly_income, savings, currency, expenses")
        .eq("user_id", userId)
        .maybeSingle<FinanceRow>();
      if (cancelled) return;
      if (e) { setError(e.message); setLoading(false); return; }
      if (data) {
        const n = normalizeRow(data);
        setBudget(n.budget); setSavings(n.savings); setCurrency(n.currency); setExpenses(n.expenses);
        clearLegacy(userId); setLoading(false); return;
      }
      const legacy = readLegacy(userId) ?? { budget: 0, savings: 0, currency: DEFAULT_CURRENCY, expenses: [] };
      setBudget(legacy.budget); setSavings(legacy.savings); setCurrency(legacy.currency); setExpenses(legacy.expenses);
      try {
        await saveVault(legacy.budget, legacy.savings, legacy.currency, legacy.expenses);
        if (!cancelled) clearLegacy(userId);
      } catch (ie) {
        if (!cancelled) setError(ie instanceof Error ? ie.message : "Migration failed");
      }
      if (!cancelled) setLoading(false);
    }
    load().catch(() => { if (!cancelled) { setError("Unable to load."); setLoading(false); } });
    return () => { cancelled = true; };
  }, [supabase, userId]);

  useEffect(() => {
    if (loading || error) return;
    const t = window.setTimeout(() => {
      if (!canSave()) {
        setSaveError("Saving too frequently — please slow down.");
        return;
      }
      setSaveError("");
      setIsSaving(true);
      saveVault(budget, savings, currency, expenses)
        .catch(e => setSaveError(e instanceof Error ? e.message : "Save failed"))
        .finally(() => setIsSaving(false));
    }, 350);
    return () => window.clearTimeout(t);
  }, [budget, savings, currency, expenses, error, loading, canSave]);

  useEffect(() => {
    if (savings > budget) setSavings(budget);
  }, [budget, savings]);

  function addExpense(e: React.FormEvent) {
    e.preventDefault();
    const v = Number(amount);
    if (!name.trim() || !Number.isFinite(v) || v <= 0) return;
    setExpenses(prev => [{ id: crypto.randomUUID(), name: name.trim(), amount: v, category }, ...prev]);
    setName(""); setAmount("");
  }

  function removeExpense(id: string) { setExpenses(p => p.filter(i => i.id !== id)); }

  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #e3e5ea", borderTopColor: "#0d0f12", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: "#7a8394", fontSize: 13 }}>Loading your data…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div className="content">
      <div className="card" style={{ borderColor: "#fecaca", background: "#fef2f2", maxWidth: 480 }}>
        <h2 style={{ color: "#991b1b", fontSize: 15, fontWeight: 600 }}>Error loading data</h2>
        <p style={{ color: "#dc2626", fontSize: 13, marginTop: 6 }}>{error}</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-title">Expenses</span>
          {isSaving && <span style={{ fontSize: 11, color: "#b2b9c4", fontFamily: "var(--font-mono)" }}>● saving…</span>}
          {saveError && <span style={{ fontSize: 11, color: "var(--danger)" }}>⚠ {saveError}</span>}
        </div>
      </div>

      <div className="content">
        {/* Stats row */}
        <div className="grid-4 fade-up" style={{ marginBottom: 20 }}>
          <div className="stat-tile">
            <div className="stat-tile-label">Monthly budget</div>
            <div className="stat-tile-value">{formatMoney(budgetValue, currency)}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile-label">Savings</div>
            <div className="stat-tile-value" style={{ color: "var(--accent)" }}>{formatMoney(savingsValue, currency)}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile-label">Total spent</div>
            <div className="stat-tile-value" style={{ color: total > spendableBudget && spendableBudget > 0 ? "var(--danger)" : "var(--ink)" }}>
              {formatMoney(total, currency)}
            </div>
            <div className="stat-tile-sub">{pct.toFixed(0)}% of expense budget used</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile-label">Remaining for expenses</div>
            <div className="stat-tile-value" style={{ color: remaining < 0 ? "var(--danger)" : "var(--accent)" }}>
              {formatMoney(remaining, currency)}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {spendableBudget > 0 && (
          <div className="card fade-up" style={{ marginBottom: 20, padding: "16px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Expense budget usage</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: pct >= 90 ? "var(--danger)" : pct >= 70 ? "var(--warning)" : "var(--accent)" }}>
                {pct.toFixed(0)}%
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{
                width: `${pct}%`,
                background: pct >= 90 ? "var(--danger)" : pct >= 70 ? "var(--warning)" : "var(--accent)",
              }} />
            </div>
          </div>
        )}

        <div className="expenses-layout">
          {/* Left: expense list */}
          <div>
            <div className="card fade-up" style={{ marginBottom: 20 }}>
              <div className="section-heading">Add expense</div>
              <form onSubmit={addExpense}>
                <div className="expense-add-row">
                  <div>
                    <label className="field-label">Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Coffee" maxLength={100} />
                  </div>
                  <div>
                    <label className="field-label">Amount ({currency})</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="0.01" max="1000000" step="0.01" placeholder="0.00" />
                  </div>
                </div>
                <div className="expense-add-actions">
                  <div style={{ flex: 1 }}>
                    <label className="field-label">Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ flexShrink: 0, width: "100%" }}>Add expense</button>
                </div>
              </form>
            </div>

            <div className="card fade-up">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div className="section-heading" style={{ marginBottom: 0 }}>Recent expenses</div>
                <span style={{ fontSize: 12, color: "var(--ink-4)" }}>{expenses.length} items</span>
              </div>
              {expenses.length === 0 ? (
                <div className="empty-state">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect x="4" y="8" width="24" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M4 13h24" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M10 18h5M10 21h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p>No expenses yet. Add one above.</p>
                </div>
              ) : (
                <div>
                  {expenses.map(item => (
                    <div key={item.id} className="expense-row">
                      <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: CAT_COLORS[item.category] || "#6b7280" }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 13.5, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 1 }}>{item.category}</div>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", fontVariantNumeric: "tabular-nums", marginRight: 12 }}>
                        {formatMoney(item.amount, currency)}
                      </span>
                      <button onClick={() => removeExpense(item.id)} className="btn btn-sm" style={{
                        background: "transparent", border: "none", padding: "4px 6px",
                        color: "var(--ink-4)", cursor: "pointer", borderRadius: 4,
                      }}>
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                          <path d="M2 4h10M5 4V3h4v1M5.5 6.5v4M8.5 6.5v4M3 4l.8 8h6.4L11 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="card fade-up">
              <div className="section-heading">Monthly budget</div>
              <label className="field-label">Amount ({currency})</label>
              <div style={{ fontSize: 13.5, color: "var(--ink)", padding: "8px 0" }}>
                {formatMoney(budget, currency)}
              </div>
            </div>

            <div className="card fade-up">
              <div className="section-heading">Savings</div>
              <label className="field-label">Amount ({currency})</label>
              <input type="number" value={savings} onChange={e => setSavings(Math.max(0, Number(e.target.value)))} min="0" max={budgetValue > 0 ? budgetValue : undefined} step="0.01" placeholder="0.00" />
            </div>

            {Object.keys(byCategory).length > 0 && (
              <div className="card fade-up">
                <div className="section-heading">By category</div>
                {Object.entries(byCategory).sort((a,b) => b[1]-a[1]).map(([cat, val]) => (
                  <div key={cat} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: CAT_COLORS[cat] || "#6b7280" }} />
                        <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{cat}</span>
                      </div>
                      <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{formatMoney(val, currency)}</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${total > 0 ? (val / total) * 100 : 0}%`, background: CAT_COLORS[cat] || "#6b7280" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
