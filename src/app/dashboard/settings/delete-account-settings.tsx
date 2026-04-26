"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteAccountCard() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleDeleteAccount() {
    setIsDeleting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete account");
      }

      setStatus({ type: "success", message: "Account deleted. Redirecting..." });
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      setStatus({ type: "error", message });
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div style={{ ...rowStyle, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, borderBottom: "none" }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--danger-text)", display: "flex", alignItems: "center", gap: 7 }}>
            Delete account
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
            Permanently delete your account and all associated data
          </div>
        </div>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={isDeleting}
          style={{
            background: "var(--danger)",
            color: "#fff",
            border: "none",
            padding: "6px 14px",
            borderRadius: "var(--r-md)",
            fontSize: 13,
            fontWeight: 500,
            cursor: isDeleting ? "not-allowed" : "pointer",
            opacity: isDeleting ? 0.65 : 1,
            fontFamily: "var(--font)",
          }}
        >
          {isDeleting ? "Deleting…" : "Delete"}
        </button>
      </div>

      {status && (
        <div
          style={{
            fontSize: 12.5,
            color: status.type === "success" ? "var(--accent)" : "var(--danger)",
            lineHeight: 1.45,
            marginTop: 12,
          }}
        >
          {status.message}
        </div>
      )}

      {showConfirm && !isDeleting && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>
                Delete Account?
              </div>
              <div style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.5 }}>
                This action is permanent and cannot be undone. Your account and all associated data (expenses, settings, etc.) will be permanently deleted from our servers.
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                style={{
                  background: "transparent",
                  color: "var(--ink)",
                  border: "1px solid var(--border)",
                  padding: "6px 14px",
                  borderRadius: "var(--r-md)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "var(--font)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                style={{
                  background: "var(--danger)",
                  color: "#fff",
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: "var(--r-md)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  opacity: isDeleting ? 0.65 : 1,
                  fontFamily: "var(--font)",
                }}
              >
                {isDeleting ? "Deleting…" : "Yes, Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 12,
  alignItems: "center",
  padding: "9px 0",
  borderBottom: "1px solid var(--border)",
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  backdropFilter: "blur(2px)",
};

const modalStyle: React.CSSProperties = {
  background: "var(--surface)",
  borderRadius: "var(--r-lg)",
  padding: 20,
  maxWidth: 400,
  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
  border: "1px solid var(--border)",
};
