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
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: 460,
            borderRadius: 16,
            border: "1px solid #f0f0f0",
            background: "#fff",
            padding: "2rem",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: "700", color: "#111827" }}>📊 Loading Charts</h1>
          <p style={{ marginTop: 12, marginBottom: 0, color: "#6b7280", fontSize: 15 }}>
            Fetching your analytics data...
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
          width: "100%",
          margin: 0,
          padding: "1.5rem 2rem",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 40, marginBottom: 4, fontWeight: "800", color: "#111827" }}>📊 Charts & Analytics</h1>
            <p style={{ margin: 0, color: "#6b7280", fontSize: 15 }}>
              Visualize your spending patterns
            </p>
          </div>
          <Link
            href="/dashboard/expenses"
            style={{
              border: "2px solid #e5e7eb",
              background: "#fff",
              color: "#111827",
              borderRadius: 10,
              padding: "10px 16px",
              cursor: "pointer",
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.transform = "translateY(-2px)";
              (e.target as HTMLElement).style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.transform = "translateY(0)";
              (e.target as HTMLElement).style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
            }}
          >
            ← Back to Expenses
          </Link>
        </div>

        <section
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "3rem 2rem",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
            border: "1px solid #f0f0f0",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📉</div>
          <p style={{ color: "#6b7280", fontSize: 16, marginBottom: 24, margin: 0 }}>
            No expenses yet. Add some expenses to see your analytics and visualizations!
          </p>
          <Link
            href="/dashboard/expenses"
            style={{
              display: "inline-block",
              marginTop: 16,
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: 10,
              textDecoration: "none",
              fontWeight: 600,
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
          <h1 style={{ fontSize: 40, marginBottom: 4, fontWeight: "800", color: "#111827" }}>📊 Charts & Analytics</h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 15 }}>
            Visualize your spending patterns
          </p>
        </div>
        <Link
          href="/dashboard/expenses"
          style={{
            border: "none",
            background: "#fff",
            color: "#111827",
            borderRadius: 10,
            padding: "10px 16px",
            cursor: "pointer",
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.transform = "translateY(-2px)";
            (e.target as HTMLElement).style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.15)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.transform = "translateY(0)";
            (e.target as HTMLElement).style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
          }}
        >
          ← Back to Expenses
        </Link>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
              padding: "1.5rem",
              borderRadius: 14,
              border: "1px solid #93c5fd",
              boxShadow: "0 10px 25px rgba(59, 130, 246, 0.1)",
            }}
          >
            <div style={{ color: "#1e40af", fontSize: 13, marginBottom: 8, fontWeight: "600" }}>Total Budget</div>
            <div style={{ fontSize: 28, fontWeight: "800", color: "#1e3a8a" }}>${budgetValue.toFixed(2)}</div>
          </div>
          <div
            style={{
              background: "linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)",
              padding: "1.5rem",
              borderRadius: 14,
              border: "1px solid #f87171",
              boxShadow: "0 10px 25px rgba(239, 68, 68, 0.1)",
            }}
          >
            <div style={{ color: "#991b1b", fontSize: 13, marginBottom: 8, fontWeight: "600" }}>Total Spent</div>
            <div style={{ fontSize: 28, fontWeight: "800", color: "#7f1d1d" }}>${total.toFixed(2)}</div>
          </div>
          <div
            style={{
              background: remaining < 0 
                ? "linear-gradient(135deg, #fca5a5 0%, #f87171 100%)"
                : "linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%)",
              padding: "1.5rem",
              borderRadius: 14,
              border: remaining < 0 ? "1px solid #f87171" : "1px solid #6ee7b7",
              boxShadow: remaining < 0 
                ? "0 10px 25px rgba(239, 68, 68, 0.1)"
                : "0 10px 25px rgba(16, 185, 129, 0.1)",
            }}
          >
            <div style={{ color: remaining < 0 ? "#991b1b" : "#065f46", fontSize: 13, marginBottom: 8, fontWeight: "600" }}>Remaining</div>
            <div style={{ fontSize: 28, fontWeight: "800", color: remaining < 0 ? "#7f1d1d" : "#047857" }}>
              ${remaining.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20, overflowY: "auto", paddingBottom: "1rem", height: "100%" }}>
        <section
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "2rem",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
            border: "1px solid #f0f0f0",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 500,
          }}
        >
          <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 24, fontWeight: "700", color: "#111827" }}>💳 Budget Overview</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={budgetComparisonData}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: 12 }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value) => `$${Number(value).toFixed(2)}`}
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

      <section
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "2rem",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
          border: "1px solid #f0f0f0",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 500,
        }}
      >
        <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 24, fontWeight: "700", color: "#111827" }}>📈 Spending by Category</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={barChartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="category" stroke="#9ca3af" style={{ fontSize: 12 }} />
            <YAxis stroke="#9ca3af" style={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value) => `$${Number(value).toFixed(2)}`}
              contentStyle={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} />
          </BarChart>
          </ResponsiveContainer>
      </section>

      <section
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "2rem",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
          border: "1px solid #f0f0f0",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 500,
        }}
      >
        <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 24, fontWeight: "700", color: "#111827" }}>🥧 Expense Distribution</h2>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: $${value}`}
              outerRadius={110}
              fill="#8884d8"
              dataKey="value"
            >
              {pieChartData.map((_, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => `$${Number(value).toFixed(2)}`}
              contentStyle={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </section>
      </div>
    </main>
  );
}
