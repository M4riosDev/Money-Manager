"use client";

import { useState } from "react";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import { formatMoney, type SupportedCurrency } from "@/lib/currency";

export type SavingGoal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  icon: string;
  color: string;
};

const GOAL_ICONS = ["🏠", "🚗", "✈️", "🎓", "💍", "🏖️", "🏥", "💻", "🛡️", "🎯"];
const GOAL_COLORS = [
  "#3b82f6", "#16a34a", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#ef4444", "#0ea5e9",
];

const GOAL_PRESETS = [
  { name: "House Downpayment", icon: "🏠" },
  { name: "Emergency Fund",    icon: "🛡️" },
  { name: "New Car",           icon: "🚗" },
  { name: "Vacation",          icon: "✈️" },
  { name: "Education",         icon: "🎓" },
  { name: "Wedding",           icon: "💍" },
  { name: "Medical",           icon: "🏥" },
  { name: "Tech",              icon: "💻" },
];

function GoalRadial({ pct, color, done }: { pct: number; color: string; done: boolean }) {
  const fill = done ? "#16a34a" : color;
  return (
    <div style={{ width: 56, height: 56, position: "relative", flexShrink: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%" cy="50%"
          innerRadius="68%" outerRadius="100%"
          startAngle={90} endAngle={-270}
          data={[{ value: 100, fill: "#e3e5ea" }, { value: pct, fill }]}
          barSize={6}
        >
          <RadialBar dataKey="value" background={false} isAnimationActive />
        </RadialBarChart>
      </ResponsiveContainer>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: done ? 15 : 10,
        fontWeight: 600,
        color: done ? "#16a34a" : "var(--ink-3)",
      }}>
        {done ? "✓" : `${Math.round(pct)}%`}
      </div>
    </div>
  );
}

function GoalCard({
  goal,
  currency,
  onAddSavings,
  onDelete,
}: {
  goal: SavingGoal;
  currency: SupportedCurrency;
  onAddSavings: (id: string, amount: number) => void;
  onDelete: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [warning, setWarning] = useState("");

  const pct       = goal.target > 0 ? Math.min(100, (goal.saved / goal.target) * 100) : 0;
  const remaining = Math.max(0, goal.target - goal.saved);
  const done      = goal.saved >= goal.target && goal.target > 0;

  function handleAmountChange(raw: string) {
    setAddAmount(raw);
    const v = parseFloat(raw);
    if (!raw || isNaN(v)) { setWarning(""); return; }
    if (v <= 0) {
      setWarning("Amount must be greater than 0.");
    } else if (v > remaining) {
      setWarning(
        `You're adding ${formatMoney(v - remaining, currency)} more than needed. ` +
        `Max to complete: ${formatMoney(remaining, currency)}.`
      );
    } else {
      setWarning("");
    }
  }

  function handleAdd() {
    const v = parseFloat(addAmount);
    if (!v || v <= 0) return;
    const capped = Math.min(v, remaining);
    onAddSavings(goal.id, capped);
    setAddAmount(""); setWarning(""); setAdding(false);
  }

  const addVal     = parseFloat(addAmount);
  const addInvalid = !addAmount || isNaN(addVal) || addVal <= 0;
  const isOver     = !addInvalid && addVal > remaining;

  return (
    <div style={{
      borderRadius: 12,
      border: `1px solid ${done ? "#bbf7d0" : "var(--border)"}`,
      background: done ? "#f0fdf4" : "var(--surface)",
      padding: "14px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <GoalRadial pct={pct} color={goal.color} done={done} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13.5, fontWeight: 600, color: "var(--ink)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span>{goal.icon}</span>
            {goal.name}
            {done && (
              <span style={{
                fontSize: 10.5, background: "#16a34a18", color: "#16a34a",
                borderRadius: 99, padding: "1px 7px", fontWeight: 500, flexShrink: 0,
              }}>✓ Done</span>
            )}
          </div>
          <div style={{ marginTop: 4, display: "flex", gap: 10, alignItems: "baseline" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
              {formatMoney(goal.saved, currency)}
            </span>
            <span style={{ fontSize: 11.5, color: "var(--ink-4)" }}>
              of {formatMoney(goal.target, currency)}
            </span>
          </div>
          {!done && (
            <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 1 }}>
              {formatMoney(remaining, currency)} to go
            </div>
          )}
        </div>

        <button
          onClick={() => onDelete(goal.id)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--ink-4)", fontSize: 16, padding: "2px 5px",
            lineHeight: 1, flexShrink: 0, alignSelf: "flex-start",
          }}
          title="Delete goal"
        >×</button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 5, borderRadius: 99, background: "var(--surface-3)", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: 99,
          background: done ? "#16a34a" : goal.color,
          transition: "width 0.5s ease",
        }} />
      </div>

      {/* Add savings */}
      {!done && (
        adding ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type="number"
                value={addAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder={`up to ${formatMoney(remaining, currency)}`}
                min="0.01"
                step="0.01"
                autoFocus
                style={{ flex: 1, fontSize: 13, borderColor: isOver ? "#f59e0b" : undefined }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !addInvalid) handleAdd();
                  if (e.key === "Escape") { setAdding(false); setAddAmount(""); setWarning(""); }
                }}
              />
              <button onClick={handleAdd} className="btn btn-primary btn-sm" disabled={addInvalid} style={{ flexShrink: 0 }}>
                Add
              </button>
              <button onClick={() => { setAdding(false); setAddAmount(""); setWarning(""); }} className="btn btn-sm" style={{ flexShrink: 0 }}>
                Cancel
              </button>
            </div>

            {warning && (
              <div style={{
                fontSize: 11.5, lineHeight: 1.45,
                color: isOver ? "#92400e" : "var(--danger)",
                background: isOver ? "#fffbeb" : "#fef2f2",
                border: `1px solid ${isOver ? "#fde68a" : "#fecaca"}`,
                borderRadius: 7, padding: "6px 10px",
              }}>
                {isOver ? "⚠️" : "✕"} {warning}
                {isOver && (
                  <span style={{ display: "block", marginTop: 2, color: "#78350f" }}>
                    Will be capped at {formatMoney(remaining, currency)}.
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="btn btn-sm"
            style={{ fontSize: 12, width: "100%", color: goal.color, borderColor: goal.color + "44" }}
          >
            + Add savings
          </button>
        )
      )}
    </div>
  );
}

export default function SavingsGoals({
  goals,
  currency,
  onChange,
}: {
  goals: SavingGoal[];
  currency: SupportedCurrency;
  onChange: (goals: SavingGoal[]) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName]     = useState("");
  const [target, setTarget] = useState("");
  const [targetWarning, setTargetWarning] = useState("");
  const [icon, setIcon]     = useState("🎯");
  const [color, setColor]   = useState(GOAL_COLORS[0]);

  function handleTargetChange(raw: string) {
    setTarget(raw);
    const v = parseFloat(raw);
    if (!raw || isNaN(v)) { setTargetWarning(""); return; }
    if (v <= 0) setTargetWarning("Target must be greater than 0.");
    else setTargetWarning("");
  }

  function handleAdd() {
    const t = parseFloat(target);
    if (!name.trim() || !t || t <= 0) return;
    const newGoal: SavingGoal = {
      id: crypto.randomUUID(),
      name: name.trim(), target: t, saved: 0, icon, color,
    };
    onChange([...goals, newGoal]);
    setName(""); setTarget(""); setIcon("🎯");
    setColor(GOAL_COLORS[goals.length % GOAL_COLORS.length]);
    setTargetWarning(""); setShowForm(false);
  }

  function handleAddSavings(id: string, amount: number) {
    onChange(goals.map((g) =>
      g.id === id ? { ...g, saved: Math.min(g.target, g.saved + amount) } : g
    ));
  }

  function handleDelete(id: string) {
    onChange(goals.filter((g) => g.id !== id));
  }

  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const totalSaved  = goals.reduce((s, g) => s + g.saved, 0);
  const totalPct    = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
  const canAdd      = name.trim().length > 0 && parseFloat(target) > 0 && !targetWarning;

  return (
    <div className="card fade-up">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div className="section-heading" style={{ marginBottom: 0 }}>Savings Goals</div>
        {goals.length > 0 && (
          <div style={{ fontSize: 11.5, color: "var(--ink-4)", textAlign: "right" }}>
            {totalPct}% · {formatMoney(totalSaved, currency)} / {formatMoney(totalTarget, currency)}
          </div>
        )}
      </div>

      {goals.length === 0 && !showForm && (
        <div style={{ textAlign: "center", padding: "20px 0 8px", color: "var(--ink-4)", fontSize: 13 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
          <div style={{ marginBottom: 4, fontWeight: 500, color: "var(--ink-3)" }}>No goals yet</div>
          <div style={{ fontSize: 12 }}>Track savings for a downpayment, vacation, or anything.</div>
        </div>
      )}

      {goals.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} currency={currency} onAddSavings={handleAddSavings} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showForm ? (
        <div style={{ border: "1px dashed var(--border)", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 6 }}>Quick presets</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {GOAL_PRESETS.map((p) => (
                <button key={p.name} onClick={() => { setName(p.name); setIcon(p.icon); }} className="btn btn-sm"
                  style={{ fontSize: 11.5, padding: "3px 9px", background: name === p.name ? "var(--ink)" : undefined, color: name === p.name ? "#fff" : undefined }}>
                  {p.icon} {p.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="field-label">Goal name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. House Downpayment" maxLength={60} autoFocus />
          </div>

          <div>
            <label className="field-label">Target amount ({currency})</label>
            <input
              type="number" value={target} onChange={(e) => handleTargetChange(e.target.value)}
              placeholder="0.00" min="0.01" step="0.01"
              style={{ borderColor: targetWarning ? "var(--danger)" : undefined }}
            />
            {targetWarning && (
              <div style={{ fontSize: 11.5, color: "var(--danger)", marginTop: 4 }}>⚠️ {targetWarning}</div>
            )}
          </div>

          <div>
            <div style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 6 }}>Icon</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {GOAL_ICONS.map((ic) => (
                <button key={ic} onClick={() => setIcon(ic)} style={{
                  width: 32, height: 32, borderRadius: 8, fontSize: 16, cursor: "pointer",
                  border: ic === icon ? "2px solid var(--ink)" : "1px solid var(--border)",
                  background: ic === icon ? "var(--surface-2)" : "transparent",
                }}>{ic}</button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 6 }}>Colour</div>
            <div style={{ display: "flex", gap: 6 }}>
              {GOAL_COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)} style={{
                  width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer",
                  border: c === color ? "3px solid var(--ink)" : "2px solid transparent",
                  outline: c === color ? "2px solid #fff" : "none", outlineOffset: "-3px",
                }} />
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
            <button onClick={handleAdd} className="btn btn-primary btn-sm" disabled={!canAdd}>Add goal</button>
            <button onClick={() => { setShowForm(false); setName(""); setTarget(""); setTargetWarning(""); }} className="btn btn-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="btn btn-sm" style={{ width: "100%", marginTop: goals.length > 0 ? 0 : 12 }}>
          + New goal
        </button>
      )}
    </div>
  );
}
