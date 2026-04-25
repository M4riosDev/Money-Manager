"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SUPPORTED_CURRENCIES, normalizeCurrency, type SupportedCurrency } from "@/lib/currency";

export default function CurrencySettingsCard({
  userId,
  initialCurrency,
}: {
  userId: string;
  initialCurrency: SupportedCurrency;
}) {
  const [supabase] = useState(() => createClient());
  const [currency, setCurrency] = useState<SupportedCurrency>(initialCurrency);
  const [savedCurrency, setSavedCurrency] = useState<SupportedCurrency>(initialCurrency);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setCurrency(initialCurrency);
    setSavedCurrency(initialCurrency);
  }, [initialCurrency]);

  async function handleSave() {
    const cleanCurrency = normalizeCurrency(currency);

    setIsSaving(true);
    setStatus("");

    const { error } = await supabase
      .from("vaults")
      .upsert({ user_id: userId, currency: cleanCurrency }, { onConflict: "user_id" });

    setIsSaving(false);

    if (error) {
      setStatus(error.message);
      return;
    }

    setSavedCurrency(cleanCurrency);
    setStatus("Currency saved.");
  }

  const hasChanges = currency !== savedCurrency;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div>
        <label className="field-label">Currency code</label>
        <select value={currency} onChange={(e) => setCurrency(normalizeCurrency(e.target.value))}>
          {SUPPORTED_CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="btn btn-primary btn-sm"
          style={{ flexShrink: 0, opacity: !hasChanges || isSaving ? 0.65 : 1 }}
        >
          {isSaving ? "Saving…" : "Save currency"}
        </button>
      </div>

      {status && (
        <div style={{ fontSize: 12.5, color: status === "Currency saved." ? "var(--accent)" : "var(--danger)" }}>
          {status}
        </div>
      )}
    </div>
  );
}