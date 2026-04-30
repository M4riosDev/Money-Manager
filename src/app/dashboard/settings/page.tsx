import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CURRENCY, normalizeCurrency } from "@/lib/currency";
import { normalizeIncomeMode, type IncomeMode } from "@/lib/income";
import CurrencySettingsCard from "@/app/dashboard/settings/currency-settings";
import MonthlyIncomeSettingsCard from "@/app/dashboard/settings/monthly-income-settings";
import EmailSettingsCard from "@/app/dashboard/settings/email-settings";
import DeleteAccountCard from "@/app/dashboard/settings/delete-account-settings";

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

  const { data: vault } = await supabase
    .from("vaults")
    .select("currency, monthly_income, extra_income, income_mode")
    .eq("user_id", user.id)
    .maybeSingle<{
      currency: string | null;
      monthly_income: number | string | null;
      extra_income: number | string | null;
      income_mode: IncomeMode | null;
    }>();

  const currentCurrency = normalizeCurrency(vault?.currency ?? DEFAULT_CURRENCY);
  const currentIncome = Number(vault?.monthly_income) > 0 ? Number(vault?.monthly_income) : 0;
  const currentExtraIncome = Number(vault?.extra_income) > 0 ? Number(vault?.extra_income) : 0;
  const currentIncomeMode = normalizeIncomeMode(vault?.income_mode);

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-title">Settings</span>
        </div>
      </div>

      <div className="content">
        <div className="settings-container">

          {/* Profile */}
          <div className="card fade-up" style={{ animationDelay: "0ms" }}>
            <div className="section-heading">Profile</div>

            <div className="settings-profile-head">
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

            <div className="settings-row">
              <div style={labelStyle}>Username</div>
              <div style={valueStyle}>{username}</div>
            </div>

            <div className="settings-row">
              <div style={labelStyle}>Email</div>
              <div style={valueStyle}>{user.email ?? "Not set"}</div>
            </div>

            <div style={{ paddingTop: 4 }}>
              <div style={{ ...labelStyle, marginBottom: 4 }}>Change email</div>
              <EmailSettingsCard currentEmail={user.email ?? ""} />
            </div>
          </div>

          {/* Preferences */}
          <div className="card fade-up" style={{ animationDelay: "50ms" }}>
            <div className="section-heading">Preferences</div>

            <CurrencySettingsCard userId={user.id} initialCurrency={currentCurrency} />

            <MonthlyIncomeSettingsCard
              userId={user.id}
              initialIncome={currentIncome}
              initialExtraIncome={currentExtraIncome}
              initialIncomeMode={currentIncomeMode}
              currency={currentCurrency}
            />
          </div>

          {/* Account */}
          <div className="card fade-up" style={{ animationDelay: "100ms" }}>
            <div className="section-heading">Account</div>

            <div className="settings-row">
              <div style={labelStyle}>Account ID</div>
              <div style={{
                fontSize: 11.5, color: "var(--ink-4)",
                fontFamily: "var(--font-mono)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }} title={user.id}>
                {user.id}
              </div>
            </div>

            <div className="settings-row">
              <div style={labelStyle}>Sign-in method</div>
              <div>
                <span style={pillStyle}>{user.app_metadata?.provider ?? "Email"}</span>
              </div>
            </div>

            <div className="settings-row" style={{ borderBottom: "none", paddingBottom: 2 }}>
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
            <DeleteAccountCard />
          </div>

        </div>
      </div>
    </>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "var(--ink-3)",
};

const valueStyle: React.CSSProperties = {
  fontSize: 13.5,
  color: "var(--ink)",
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
