"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function EmailSettingsCard({
  currentEmail,
}: {
  currentEmail: string;
}) {
  const [supabase] = useState(() => createClient());
  const [newEmail, setNewEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isValid = newEmail.includes("@") && newEmail !== currentEmail && newEmail.trim().length > 0;

  async function handleChange() {
    if (!isValid) return;
    setIsSaving(true);
    setStatus(null);

    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });

    setIsSaving(false);

    if (error) {
      setStatus({ type: "error", message: error.message });
      return;
    }

    setStatus({
      type: "success",
      message: "Confirmation emails sent to both addresses. Click the link in each to confirm the change.",
    });
    setNewEmail("");
  }

  return (
    <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
      <div>
        <label className="field-label">New email address</label>
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder={currentEmail}
          autoComplete="email"
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="button"
          onClick={handleChange}
          disabled={!isValid || isSaving}
          className="btn btn-primary btn-sm"
          style={{ flexShrink: 0, opacity: !isValid || isSaving ? 0.65 : 1 }}
        >
          {isSaving ? "Sending…" : "Change email"}
        </button>
      </div>

      {status && (
        <div
          style={{
            fontSize: 12.5,
            color: status.type === "success" ? "var(--accent)" : "var(--danger)",
            lineHeight: 1.45,
          }}
        >
          {status.message}
        </div>
      )}
    </div>
  );
}
