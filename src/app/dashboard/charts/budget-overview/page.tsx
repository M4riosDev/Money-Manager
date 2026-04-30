"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_CURRENCY, formatMoney, normalizeCurrency, type SupportedCurrency } from "@/lib/currency";
import { normalizeIncomeMode, resolveEffectiveIncome, type IncomeMode } from "@/lib/income";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Expense = {
  id: string;
  name: string;
  amount: number;
  category: string;
};

type FinanceRow = {
  budget: number | string | null;
  monthly_income?: number | string | null;
  extra_income?: number | string | null;
  income_mode?: IncomeMode | null;
  currency: string | null;
  expenses: Expense[];
};

export default function BudgetOverviewPage() {
  const [supabase] = useState(() => createClient());
  const [userId, setUserId] = useState<string | null>(null);
  const [budget, setBudget] = useState(0);
  const [incomeMode, setIncomeMode] = useState<IncomeMode>("fixed");
  const [currency, setCurrency] = useState<SupportedCurrency>(DEFAULT_CURRENCY);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      const { data } = await supabase
        .from("vaults")
        .select("budget, monthly_income, extra_income, income_mode, currency, expenses")
        .eq("user_id", userId)
        .maybeSingle<FinanceRow>();

      if (data) {
        setBudget(resolveEffectiveIncome(data));
        setIncomeMode(normalizeIncomeMode(data.income_mode));
        setCurrency(normalizeCurrency(data.currency));
        setExpenses(Array.isArray(data.expenses) ? data.expenses : []);
      }
      setLoading(false);
    };

    loadData();
  }, [supabase, userId]);

  const total = useMemo(() => {
    return expenses.reduce((sum, item) => sum + item.amount, 0);
  }, [expenses]);

  const remaining = budget - total;

  const data = useMemo(
    () => [
      { name: "Budget", value: budget },
      { name: "Spent", value: total },
      { name: "Remaining", value: Math.max(0, remaining) },
    ],
    [budget, total, remaining]
  );

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        Loading chart...
      </div>
    );
  }

  return (
    <main className="chart-page-main">
      <Link
        href="/dashboard"
        style={{
          display: "inline-block",
          marginBottom: "1.5rem",
          color: "#3b82f6",
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        ← Back to Dashboard
      </Link>

      <section className="chart-page-section">
        <h1 className="chart-page-title">{incomeMode === "self_employed" ? "Income Overview" : "Budget Overview"}</h1>
        <div className="chart-kpi-grid">
          <div
            className="chart-kpi-card"
          >
            <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 4 }}>
              {incomeMode === "self_employed" ? "Available Income" : "Total Budget"}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{formatMoney(budget, currency)}</div>
          </div>
          <div
            className="chart-kpi-card"
          >
            <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 4 }}>Total Spent</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{formatMoney(total, currency)}</div>
          </div>
          <div
            className="chart-kpi-card"
          >
            <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 4 }}>Remaining</div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: remaining < 0 ? "#b91c1c" : "#065f46",
              }}
            >
              {formatMoney(remaining, currency)}
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => formatMoney(Number(value), currency)} />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </main>
  );
}
