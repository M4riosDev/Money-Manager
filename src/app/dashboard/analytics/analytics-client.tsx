"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

export default function AnalyticsClient({ userId }: { userId: string }) {
  const [supabase] = useState(() => createClient());
  const [budget, setBudget] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const budgetValue = Number(budget) > 0 ? Number(budget) : 0;
  const remaining = budgetValue - total;

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of expenses) {
      map[item.category] = (map[item.category] || 0) + item.amount;
    }
    return map;
  }, [expenses]);

  const barChartData = useMemo(() => {
    return Object.entries(byCategory).map(([category, amount]) => ({
      category,
      amount: Number(amount.toFixed(2)),
    }));
  }, [byCategory]);

  const budgetComparisonData = useMemo(() => {
    return [
      { name: "Budget", value: budgetValue },
      { name: "Spent", value: Number(total.toFixed(2)) },
      { name: "Remaining", value: Math.max(0, remaining) },
    ];
  }, [budgetValue, total, remaining]);

  const pieChartData = useMemo(() => {
    return Object.entries(byCategory).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
    }));
  }, [byCategory]);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

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
          <h1 style={{ margin: 0, fontSize: 30 }}>Loading charts</h1>
          <p style={{ marginTop: 8, marginBottom: 0, color: "#4b5563" }}>
            Fetching your analytics data.
          </p>
        </section>
      </main>
    );
  }

  if (expenses.length === 0) {
    return (
      <main
        style={{
          minHeight: "100vh",
          maxWidth: 760,
          margin: "0 auto",
          padding: "2rem 1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 34, marginBottom: 8 }}>Charts & Analytics</h1>
            <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
              Visualize your spending patterns
            </p>
          </div>
          <Link
            href="/dashboard/expenses"
            style={{
              border: "1px solid #d1d5db",
              background: "#fff",
              color: "#111827",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            ← Back to Expenses
          </Link>
        </div>

        <section
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "1.5rem",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#6b7280", fontSize: 16 }}>
            No expenses yet. Add some expenses to see your analytics!
          </p>
          <Link
            href="/dashboard/expenses"
            style={{
              display: "inline-block",
              marginTop: 12,
              background: "#111827",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Add Expenses
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        maxWidth: 900,
        margin: "0 auto",
        padding: "2rem 1rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 34, marginBottom: 8 }}>Charts & Analytics</h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
            Visualize your spending patterns
          </p>
        </div>
        <Link
          href="/dashboard/expenses"
          style={{
            border: "1px solid #d1d5db",
            background: "#fff",
            color: "#111827",
            borderRadius: 8,
            padding: "8px 12px",
            cursor: "pointer",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          ← Back to Expenses
        </Link>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 16,
            marginBottom: 20,
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
            <div style={{ fontSize: 20, fontWeight: 700 }}>${budgetValue.toFixed(2)}</div>
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
      </div>

      <section
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "1.5rem",
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 20, marginTop: 0, marginBottom: 20 }}>Budget Overview</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={budgetComparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "1.5rem",
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 20, marginTop: 0, marginBottom: 20 }}>Spending by Category</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={barChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
            <Bar dataKey="amount" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "1.5rem",
        }}
      >
        <h2 style={{ fontSize: 20, marginTop: 0, marginBottom: 20 }}>Expense Distribution</h2>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: $${value}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {pieChartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
          </PieChart>
        </ResponsiveContainer>
      </section>
    </main>
  );
}
