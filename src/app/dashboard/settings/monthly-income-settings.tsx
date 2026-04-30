"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { normalizeIncomeMode, type IncomeMode } from "@/lib/income";

export default function MonthlyIncomeSettingsCard({
  userId,
  initialIncome,
  initialExtraIncome,
  initialIncomeMode,
  currency,
}: {
  userId: string;
  initialIncome: number;
  initialExtraIncome: number;
  initialIncomeMode: IncomeMode;
  currency: string;
}) {
  const [supabase] = useState(() => createClient());
  const [incomeMode, setIncomeMode] = useState<IncomeMode>(normalizeIncomeMode(initialIncomeMode));
  const [income, setIncome] = useState(String(initialIncome));
  const [extraIncome, setExtraIncome] = useState(String(initialExtraIncome));
  const [savedIncomeMode, setSavedIncomeMode] = useState<IncomeMode>(normalizeIncomeMode(initialIncomeMode));
  const [savedIncome, setSavedIncome] = useState(String(initialIncome));
  const [savedExtraIncome, setSavedExtraIncome] = useState(String(initialExtraIncome));
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const nextIncome = String(initialIncome);
    const nextExtraIncome = String(initialExtraIncome);
    const nextMode = normalizeIncomeMode(initialIncomeMode);
    setIncomeMode(nextMode);
    setIncome(nextIncome);
    setExtraIncome(nextExtraIncome);
    setSavedIncomeMode(nextMode);
    setSavedIncome(nextIncome);
    setSavedExtraIncome(nextExtraIncome);
  }, [initialIncome, initialExtraIncome, initialIncomeMode]);

  async function handleSave() {
    const cleanIncome = Number(income);
    const cleanExtraIncome = Number(extraIncome);

    if (!Number.isFinite(cleanIncome) || cleanIncome < 0) {
      setStatus("Income must be a non-negative number.");
      return;
    }

    if (!Number.isFinite(cleanExtraIncome) || cleanExtraIncome < 0) {
      setStatus("Extra income must be a non-negative number.");
      return;
    }

    setIsSaving(true);
    setStatus("");

    const { error } = await supabase
      .from("vaults")
      .upsert(
        {
          user_id: userId,
          income_mode: incomeMode,
          monthly_income: cleanIncome,
          extra_income: cleanExtraIncome,
        },
        { onConflict: "user_id" }
      );

    setIsSaving(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setSavedIncomeMode(incomeMode);
    setSavedIncome(String(cleanIncome));
    setSavedExtraIncome(String(cleanExtraIncome));
    setStatus("Income settings saved.");
  }

  const hasChanges = income !== savedIncome || extraIncome !== savedExtraIncome || incomeMode !== savedIncomeMode;
  const effectiveIncome = (Number(income) || 0) + (Number(extraIncome) || 0);

  return (
    <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
      <div>
        <label className="field-label">Income type</label>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f3f4f6", borderRadius: 10, padding: 4 }}>
          <button
            type="button"
            onClick={() => setIncomeMode("fixed")}
            className="btn btn-sm"
            style={{
              background: incomeMode === "fixed" ? "var(--ink)" : "transparent",
              color: incomeMode === "fixed" ? "#fff" : "var(--ink-3)",
              border: "none",
            }}
          >
            Fixed salary
          </button>
          <button
            type="button"
            onClick={() => setIncomeMode("self_employed")}
            className="btn btn-sm"
            style={{
              background: incomeMode === "self_employed" ? "var(--ink)" : "transparent",
              color: incomeMode === "self_employed" ? "#fff" : "var(--ink-3)",
              border: "none",
            }}
          >
            Self-employed
          </button>
        </div>
      </div>

      <div>
        <label className="field-label">
          {incomeMode === "self_employed" ? `Estimated base income (${currency})` : `Monthly income (${currency})`}
        </label>
        <input
          type="number"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          min="0"
          step="0.01"
          placeholder="0.00"
        />
      </div>

      <div>
        <label className="field-label">Extra income this month ({currency})</label>
        <input
          type="number"
          value={extraIncome}
          onChange={(e) => setExtraIncome(e.target.value)}
          min="0"
          step="0.01"
          placeholder="0.00"
        />
      </div>

      {incomeMode === "self_employed" && (
        <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: -2 }}>
          Use base income as your monthly estimate and update extra income whenever your earnings change.
        </div>
      )}

      <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>
        Available income for this month: {effectiveIncome.toFixed(2)} {currency}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="btn btn-primary btn-sm"
          style={{ flexShrink: 0, opacity: !hasChanges || isSaving ? 0.65 : 1 }}
        >
          {isSaving ? "Saving…" : "Save income"}
        </button>
      </div>

      {status && (
        <div style={{ fontSize: 12.5, color: status === "Income settings saved." ? "var(--accent)" : "var(--danger)" }}>
          {status}
        </div>
      )}
    </div>
  );
}