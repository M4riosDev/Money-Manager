"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_CURRENCY, formatMoney, normalizeCurrency, type SupportedCurrency } from "@/lib/currency";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

type Expense = { id: string; name: string; amount: number; category: string; };
type FinanceRow = { budget: string; currency: string; expenses: Expense[]; };

const COLORS = ["#3b82f6", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", fontSize: 13 }}>
        {label && <div style={{ color: "var(--ink-3)", marginBottom: 4, fontSize: 11 }}>{label}</div>}
        <div style={{ fontWeight: 600, color: "var(--ink)" }}>{formatMoney(Number(payload[0].value), currency)}</div>
      </div>
    );
  }
  return null;
};

export default function AnalyticsClient({ userId }: { userId: string }) {
  const [supabase] = useState(() => createClient());
  const [budget, setBudget] = useState(0);
  const [currency, setCurrency] = useState<SupportedCurrency>(DEFAULT_CURRENCY);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("vaults").select("budget, currency, expenses").eq("user_id", userId).maybeSingle<FinanceRow>().then(({ data }) => {
      if (data) {
        setBudget(Number(data.budget) || 0);
        setCurrency(normalizeCurrency(data.currency));
        setExpenses(Array.isArray(data.expenses) ? data.expenses : []);
      }
      setLoading(false);
    });
  }, [supabase, userId]);

  const total = useMemo(() => expenses.reduce((s, i) => s + i.amount, 0), [expenses]);
  const remaining = budget - total;

  const byCategory = useMemo(() => {
    const m: Record<string, number> = {};
    expenses.forEach(i => { m[i.category] = (m[i.category] || 0) + i.amount; });
    return m;
  }, [expenses]);

  const barData = useMemo(() => Object.entries(byCategory).map(([category, amount]) => ({ category, amount: +amount.toFixed(2) })), [byCategory]);
  const pieData = useMemo(() => Object.entries(byCategory).map(([name, value]) => ({ name, value: +value.toFixed(2) })), [byCategory]);
  const overviewData = useMemo(() => [
    { name: "Budget", value: budget },
    { name: "Spent", value: +total.toFixed(2) },
    { name: "Remaining", value: Math.max(0, remaining) },
  ], [budget, total, remaining]);

  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #e3e5ea", borderTopColor: "#0d0f12", animation: "spin 0.7s linear infinite", margin: "0 auto 10px" }} />
        <p style={{ color: "#7a8394", fontSize: 13 }}>Loading analytics…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Analytics</span>
      </div>

      <div className="content">
        {/* Stats */}
        <div className="grid-3 fade-up" style={{ marginBottom: 20 }}>
          <div className="stat-tile">
            <div className="stat-tile-label">Total budget</div>
            <div className="stat-tile-value">{formatMoney(budget, currency)}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile-label">Total spent</div>
            <div className="stat-tile-value" style={{ color: total > budget && budget > 0 ? "var(--danger)" : "var(--ink)" }}>{formatMoney(total, currency)}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile-label">Remaining</div>
            <div className="stat-tile-value" style={{ color: remaining < 0 ? "var(--danger)" : "var(--accent)" }}>{formatMoney(remaining, currency)}</div>
          </div>
        </div>

        {expenses.length === 0 ? (
          <div className="card fade-up">
            <div className="empty-state">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect x="5" y="12" width="30" height="22" rx="4" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M5 18h30" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M14 8l6-3 6 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p>Add expenses to see your analytics and charts.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {/* Budget overview bar */}
            <div className="card fade-up">
              <div className="section-heading">Budget overview</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={overviewData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f4" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#7a8394" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#b2b9c4" }} axisLine={false} tickLine={false} tickFormatter={v => formatMoney(Number(v), currency)} />
                  <Tooltip content={<CustomTooltip currency={currency} />} />
                  <Bar dataKey="value" radius={[6,6,0,0]}>
                    {overviewData.map((entry, i) => (
                      <Cell key={i} fill={i === 0 ? "#e3e5ea" : i === 1 ? "#0d0f12" : "#16a34a"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Spending by category */}
              <div className="card fade-up">
                <div className="section-heading">Spending by category</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f4" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#b2b9c4" }} axisLine={false} tickLine={false} tickFormatter={v => formatMoney(Number(v), currency)} />
                    <YAxis type="category" dataKey="category" tick={{ fontSize: 12, fill: "#7a8394" }} axisLine={false} tickLine={false} width={70} />
                    <Tooltip content={<CustomTooltip currency={currency} />} />
                    <Bar dataKey="amount" radius={[0,4,4,0]}>
                      {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie chart */}
              <div className="card fade-up">
                <div className="section-heading">Expense distribution</div>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="45%" outerRadius={90} innerRadius={50} dataKey="value" paddingAngle={2}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatMoney(Number(v), currency)} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category table */}
            <div className="card fade-up">
              <div className="section-heading">Category breakdown</div>
              <div style={{ display: "grid", gap: 10 }}>
                {Object.entries(byCategory).sort((a,b) => b[1]-a[1]).map(([cat, val], i) => (
                  <div key={cat} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, color: "var(--ink-2)" }}>{cat}</span>
                    <span style={{ fontSize: 12, color: "var(--ink-4)" }}>{total > 0 ? ((val/total)*100).toFixed(1) : 0}%</span>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", fontVariantNumeric: "tabular-nums", minWidth: 80, textAlign: "right" }}>{formatMoney(val, currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
