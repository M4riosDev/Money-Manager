"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function MonthlyIncomeSettingsCard({
  userId,
  initialIncome,
  currency,
}: {
  userId: string;
  initialIncome: number;
  currency: string;
}) {
  const [supabase] = useState(() => createClient());
  const [income, setIncome] = useState(String(initialIncome));
  const [savedIncome, setSavedIncome] = useState(String(initialIncome));
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const nextIncome = String(initialIncome);
    setIncome(nextIncome);
    setSavedIncome(nextIncome);
  }, [initialIncome]);

  async function handleSave() {
    const cleanIncome = Number(income);

    if (!Number.isFinite(cleanIncome) || cleanIncome < 0) {
      setStatus("Income must be a non-negative number.");
      return;
    }

    setIsSaving(true);
    setStatus("");

    const { error } = await supabase
      .from("vaults")
      .upsert({ user_id: userId, monthly_income: cleanIncome }, { onConflict: "user_id" });

    setIsSaving(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setSavedIncome(String(cleanIncome));
    setStatus("Monthly income saved.");
  }

  const hasChanges = income !== savedIncome;

  return (
    <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
      <div>
        <label className="field-label">Monthly income ({currency})</label>
        <input
          type="number"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          min="0"
          step="0.01"
          placeholder="0.00"
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontSize: 12.5, color: "var(--ink-4)", lineHeight: 1.5 }}>
          Used later for budget and income-based views.
        </div>
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
        <div style={{ fontSize: 12.5, color: status === "Monthly income saved." ? "var(--accent)" : "var(--danger)" }}>
          {status}
        </div>
      )}
    </div>
  );
}