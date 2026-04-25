import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getUsername(user: {
  email?: string;
  user_metadata?: { username?: string; name?: string; full_name?: string };
}) {
  const fromMetadata =
    user.user_metadata?.username ??
    user.user_metadata?.name ??
    user.user_metadata?.full_name;
  if (fromMetadata && fromMetadata.trim().length > 0) return fromMetadata;
  if (user.email && user.email.includes("@")) return user.email.split("@")[0];
  return "Not set";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const username = getUsername({
    email: user.email,
    user_metadata: {
      username: user.user_metadata?.username,
      name: user.user_metadata?.name,
      full_name: user.user_metadata?.full_name,
    },
  });

  const initials = getInitials(username);

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Unknown";

  const lastSignIn = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Unknown";

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-title">Settings</span>
        </div>
      </div>

      <div className="content">
        <div style={{ maxWidth: 600, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Profile */}
          <div className="card fade-up" style={{ animationDelay: "0ms" }}>
            <div className="section-heading">Profile</div>

            <div style={{
              display: "flex", alignItems: "center", gap: 16,
              paddingBottom: 18, borderBottom: "1px solid var(--border)", marginBottom: 16,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "var(--ink)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 17, fontWeight: 600, flexShrink: 0, letterSpacing: "-0.02em",
              }}>
                {initials}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14.5, color: "var(--ink)" }}>{username}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>Member since {memberSince}</div>
              </div>
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Username</div>
              <div style={valueStyle}>{username}</div>
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Email</div>
              <div style={valueStyle}>{user.email ?? "Not set"}</div>
            </div>

            <div style={{ ...rowStyle, ...disabledStyle, borderBottom: "none", paddingBottom: 2 }}>
              <div style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 7 }}>
                Change email
                <span style={soonBadge}>soon</span>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ink-4)" }}>Update your email address</div>
            </div>
          </div>

          {/* Preferences */}
          <div className="card fade-up" style={{ animationDelay: "50ms" }}>
            <div className="section-heading">Preferences</div>

            <div style={rowStyle}>
              <div style={labelStyle}>Currency</div>
              <div>
                <span style={pillStyle}>EUR €</span>
              </div>
            </div>

            <div style={{ ...rowStyle, ...disabledStyle, borderBottom: "none", paddingBottom: 2 }}>
              <div style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 7 }}>
                Monthly income
                <span style={soonBadge}>soon</span>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ink-4)" }}>Set your salary or income</div>
            </div>
          </div>

          {/* Account */}
          <div className="card fade-up" style={{ animationDelay: "100ms" }}>
            <div className="section-heading">Account</div>

            <div style={rowStyle}>
              <div style={labelStyle}>Account ID</div>
              <div style={{
                fontSize: 11.5, color: "var(--ink-4)",
                fontFamily: "var(--font-mono)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }} title={user.id}>
                {user.id}
              </div>
            </div>

            <div style={rowStyle}>
              <div style={labelStyle}>Sign-in method</div>
              <div>
                <span style={pillStyle}>{user.app_metadata?.provider ?? "Email"}</span>
              </div>
            </div>

            <div style={{ ...rowStyle, borderBottom: "none", paddingBottom: 2 }}>
              <div style={labelStyle}>Last sign in</div>
              <div style={{ ...valueStyle, color: "var(--ink-3)", fontSize: 12.5 }}>{lastSignIn}</div>
            </div>
          </div>

          {/* Danger zone */}
          <div
            className="card fade-up"
            style={{
              animationDelay: "150ms",
              borderColor: "var(--danger-border)",
              background: "var(--danger-light)",
            }}
          >
            <div className="section-heading" style={{ color: "var(--danger-text)" }}>Danger zone</div>

            <div style={{ ...disabledStyle, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--danger-text)", display: "flex", alignItems: "center", gap: 7 }}>
                  Delete account
                  <span style={{ ...soonBadge, borderColor: "var(--danger-border)", color: "var(--danger-text)" }}>soon</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 2, opacity: 0.75 }}>
                  Permanently remove all your data.
                </div>
              </div>
              <button
                disabled
                style={{
                  background: "var(--danger)", color: "#fff", border: "none",
                  padding: "6px 14px", borderRadius: "var(--r-md)",
                  fontSize: 13, fontWeight: 500, opacity: 0.4, cursor: "not-allowed",
                  fontFamily: "var(--font)",
                }}
              >
                Delete
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

const rowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "140px 1fr",
  gap: 12,
  alignItems: "center",
  padding: "9px 0",
  borderBottom: "1px solid var(--border)",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "var(--ink-3)",
};

const valueStyle: React.CSSProperties = {
  fontSize: 13.5,
  color: "var(--ink)",
};

const disabledStyle: React.CSSProperties = {
  opacity: 0.45,
  pointerEvents: "none",
};

const pillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "2px 9px",
  borderRadius: 99,
  fontSize: 11.5,
  fontWeight: 500,
  background: "var(--surface-3)",
  color: "var(--ink-2)",
  textTransform: "capitalize",
};

const soonBadge: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "1px 6px",
  borderRadius: 99,
  fontSize: 10,
  fontWeight: 500,
  background: "transparent",
  color: "var(--ink-4)",
  border: "1px solid var(--border)",
  letterSpacing: "0.03em",
};
