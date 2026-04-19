"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Expense = { id: string; name: string; amount: number; category: string; };
type FinanceRow = { budget: string; expenses: Expense[]; };

const CATEGORIES = ["Food", "Bills", "Transport", "Shopping", "Health", "Other"];
const LEGACY_KEYS = ["money-manager-expenses","money-manager-budget","money-manager:budget","money-manager:expenses"];
const CAT_COLORS: Record<string, string> = {
  Food: "#3b82f6", Bills: "#ef4444", Transport: "#8b5cf6",
  Shopping: "#f59e0b", Health: "#10b981", Other: "#6b7280",
};

function normalizeRow(v: Partial<FinanceRow> | null | undefined): FinanceRow {
  if (!v) return { budget: "0", expenses: [] };
  return {
    budget: typeof v.budget === "string" ? v.budget : "0",
    expenses: Array.isArray(v.expenses) ? v.expenses.map(i => ({
      id: typeof i?.id === "string" ? i.id : crypto.randomUUID(),
      name: typeof i?.name === "string" ? i.name : "",
      amount: Number(i?.amount) || 0,
      category: typeof i?.category === "string" ? i.category : "Other",
    })) : [],
  };
}

function readLegacy(userId: string): FinanceRow | null {
  if (typeof window === "undefined") return null;
  const b = localStorage.getItem(`money-manager:${userId}:budget`) ?? localStorage.getItem("money-manager-budget");
  const eRaw = localStorage.getItem(`money-manager:${userId}:expenses`) ?? localStorage.getItem("money-manager-expenses");
  if (!b && !eRaw) return null;
  let e: Expense[] | null = null;
  try { const p = JSON.parse(eRaw ?? ""); e = Array.isArray(p) ? p : null; } catch { e = null; }
  return normalizeRow({ budget: b ?? "0", expenses: e ?? [] });
}

function clearLegacy(userId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`money-manager:${userId}:budget`);
  localStorage.removeItem(`money-manager:${userId}:expenses`);
  LEGACY_KEYS.forEach(k => localStorage.removeItem(k));
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

  const total = useMemo(() => expenses.reduce((s, i) => s + i.amount, 0), [expenses]);
  const budgetValue = Number(budget) > 0 ? Number(budget) : 0;
  const remaining = budgetValue - total;
  const pct = budgetValue > 0 ? Math.min(100, (total / budgetValue) * 100) : 0;

  const byCategory = useMemo(() => {
    const m: Record<string, number> = {};
    expenses.forEach(i => { m[i.category] = (m[i.category] || 0) + i.amount; });
    return m;
  }, [expenses]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError("");
      const { data, error: e } = await supabase.from("vaults").select("budget, expenses").eq("user_id", userId).maybeSingle<FinanceRow>();
      if (cancelled) return;
      if (e) { setError(e.message); setLoading(false); return; }
      if (data) {
        const n = normalizeRow(data);
        setBudget(n.budget); setExpenses(n.expenses);
        clearLegacy(userId); setLoading(false); return;
      }
      const legacy = readLegacy(userId) ?? { budget: "0", expenses: [] };
      setBudget(legacy.budget); setExpenses(legacy.expenses);
      const { error: ie } = await supabase.from("vaults").upsert({ user_id: userId, budget: legacy.budget, expenses: legacy.expenses }, { onConflict: "user_id" });
      if (cancelled) return;
      if (ie) setError(ie.message); else clearLegacy(userId);
      setLoading(false);
    }
    load().catch(() => { if (!cancelled) { setError("Unable to load."); setLoading(false); } });
    return () => { cancelled = true; };
  }, [supabase, userId]);

  useEffect(() => {
    if (loading || error) return;
    setIsSaving(true);
    const t = window.setTimeout(() => {
      void (async () => {
        try { await supabase.from("vaults").upsert({ user_id: userId, budget, expenses }, { onConflict: "user_id" }); }
        finally { setIsSaving(false); }
      })();
    }, 350);
    return () => window.clearTimeout(t);
  }, [budget, expenses, error, loading, supabase, userId]);

  function addExpense(e: React.FormEvent) {
    e.preventDefault();
    const v = Number(amount);
    if (!name.trim() || !Number.isFinite(v) || v <= 0) return;
    setExpenses(prev => [{ id: crypto.randomUUID(), name: name.trim(), amount: v, category }, ...prev]);
    setName(""); setAmount("");
  }

  function removeExpense(id: string) { setExpenses(p => p.filter(i => i.id !== id)); }

  async function logout() { await supabase.auth.signOut(); router.push("/login"); router.refresh(); }

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
          {isSaving && (
            <span style={{ fontSize: 11, color: "#b2b9c4", fontFamily: "var(--font-mono)" }}>● saving…</span>
          )}
        </div>
        <div className="topbar-right">
          <button onClick={logout} className="btn btn-ghost btn-sm">Sign out</button>
        </div>
      </div>

      <div className="content">
        {/* Stats row */}
        <div className="grid-3 fade-up" style={{ marginBottom: 20 }}>
          <div className="stat-tile">
            <div className="stat-tile-label">Monthly budget</div>
            <div className="stat-tile-value">€{budgetValue.toFixed(2)}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile-label">Total spent</div>
            <div className="stat-tile-value" style={{ color: total > budgetValue && budgetValue > 0 ? "var(--danger)" : "var(--ink)" }}>
              €{total.toFixed(2)}
            </div>
            <div className="stat-tile-sub">{pct.toFixed(0)}% of budget used</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile-label">Remaining</div>
            <div className="stat-tile-value" style={{ color: remaining < 0 ? "var(--danger)" : "var(--accent)" }}>
              €{remaining.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {budgetValue > 0 && (
          <div className="card fade-up" style={{ marginBottom: 20, padding: "16px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Budget usage</span>
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
          {/* Left: expense list */}
          <div>
            {/* Add expense form */}
            <div className="card fade-up" style={{ marginBottom: 20 }}>
              <div className="section-heading">Add expense</div>
              <form onSubmit={addExpense}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginBottom: 10 }}>
                  <div>
                    <label className="field-label">Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Coffee" />
                  </div>
                  <div style={{ width: 120 }}>
                    <label className="field-label">Amount (€)</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="0" step="0.01" placeholder="0.00" />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <label className="field-label">Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
                    Add expense
                  </button>
                </div>
              </form>
            </div>

            {/* Expense list */}
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
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                        background: CAT_COLORS[item.category] || "#6b7280",
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 13.5, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 1 }}>{item.category}</div>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", fontVariantNumeric: "tabular-nums", marginRight: 12 }}>
                        €{item.amount.toFixed(2)}
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

          {/* Right: sidebar panels */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Budget setting */}
            <div className="card fade-up">
              <div className="section-heading">Monthly budget</div>
              <label className="field-label">Amount (€)</label>
              <input type="number" value={budget} onChange={e => setBudget(e.target.value)} min="0" step="0.01" placeholder="2000.00" />
            </div>

            {/* Category breakdown */}
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
                      <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>€{val.toFixed(2)}</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{
                        width: `${total > 0 ? (val / total) * 100 : 0}%`,
                        background: CAT_COLORS[cat] || "#6b7280",
                      }} />
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
