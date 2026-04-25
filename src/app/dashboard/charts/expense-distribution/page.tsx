"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_CURRENCY, formatMoney, normalizeCurrency, type SupportedCurrency } from "@/lib/currency";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Expense = {
  id: string;
  name: string;
  amount: number;
  category: string;
};

type FinanceRow = {
  currency: string;
  expenses: Expense[];
};

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function ExpenseDistributionPage() {
  const [supabase] = useState(() => createClient());
  const [userId, setUserId] = useState<string | null>(null);
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
        .select("currency, expenses")
        .eq("user_id", userId)
        .maybeSingle<FinanceRow>();

      if (data) {
        setCurrency(normalizeCurrency(data.currency));
        setExpenses(Array.isArray(data.expenses) ? data.expenses : []);
      }
      setLoading(false);
    };

    loadData();
  }, [supabase, userId]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of expenses) {
      map[item.category] = (map[item.category] || 0) + item.amount;
    }
    return map;
  }, [expenses]);

  const data = useMemo(() => {
    return Object.entries(byCategory).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
    }));
  }, [byCategory]);

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        Loading chart...
      </div>
    );
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
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

      <section
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "1.5rem",
        }}
      >
        <h1 style={{ fontSize: 24, marginTop: 0, marginBottom: 20 }}>Expense Distribution</h1>

        {data.length === 0 ? (
          <p style={{ color: "#6b7280" }}>No expenses yet.</p>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 16,
                marginBottom: 24,
              }}
            >
              {data.map((item, idx) => (
                <div
                  key={item.name}
                  style={{
                    background: "#f3f4f6",
                    padding: "1rem",
                    borderRadius: 8,
                    textAlign: "center",
                    borderLeft: `4px solid ${COLORS[idx % COLORS.length]}`,
                  }}
                >
                  <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 4 }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{formatMoney(item.value, currency)}</div>
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${formatMoney(Number(value), currency)}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(Number(value), currency)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </>
        )}
      </section>
    </main>
  );
}
