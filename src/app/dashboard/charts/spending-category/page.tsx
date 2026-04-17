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

export default function SpendingCategoryPage() {
  const [supabase] = useState(() => createClient());
  const [userId, setUserId] = useState<string | null>(null);
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
        .select("expenses")
        .eq("user_id", userId)
        .maybeSingle<FinanceRow>();

      if (data) {
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
    return Object.entries(byCategory).map(([category, amount]) => ({
      category,
      amount: Number(amount.toFixed(2)),
    }));
  }, [byCategory]);

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        Loading chart...
      </div>
    );
  }

  const total = Object.values(byCategory).reduce((sum, val) => sum + val, 0);

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
        <h1 style={{ fontSize: 24, marginTop: 0, marginBottom: 20 }}>Spending by Category</h1>
        
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
              {Object.entries(byCategory).map(([category, amount]) => (
                <div
                  key={category}
                  style={{
                    background: "#f3f4f6",
                    padding: "1rem",
                    borderRadius: 8,
                    textAlign: "center",
                  }}
                >
                  <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 4 }}>
                    {category}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    ${Number(amount).toFixed(2)}
                  </div>
                  <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>
                    {((Number(amount) / total) * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                <Bar dataKey="amount" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </section>
    </main>
  );
}
