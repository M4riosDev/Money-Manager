"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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

export default function BudgetOverviewPage() {
  const [supabase] = useState(() => createClient());
  const [userId, setUserId] = useState<string | null>(null);
  const [budget, setBudget] = useState(0);
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
        .select("budget, expenses")
        .eq("user_id", userId)
        .maybeSingle<FinanceRow>();

      if (data) {
        setBudget(Number(data.budget) || 0);
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
        <h1 style={{ fontSize: 24, marginTop: 0, marginBottom: 20 }}>Budget Overview</h1>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              background: "#f3f4f6",
              padding: "1rem",
              borderRadius: 8,
              textAlign: "center",
            }}
          >
            <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 4 }}>Total Budget</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>${budget.toFixed(2)}</div>
          </div>
          <div
            style={{
              background: "#f3f4f6",
              padding: "1rem",
              borderRadius: 8,
              textAlign: "center",
            }}
          >
            <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 4 }}>Total Spent</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>${total.toFixed(2)}</div>
          </div>
          <div
            style={{
              background: "#f3f4f6",
              padding: "1rem",
              borderRadius: 8,
              textAlign: "center",
            }}
          >
            <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 4 }}>Remaining</div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: remaining < 0 ? "#b91c1c" : "#065f46",
              }}
            >
              ${remaining.toFixed(2)}
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </main>
  );
}
