import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getUsername(user: {
  email?: string;
  user_metadata?: { username?: string; name?: string; full_name?: string };
}) {
  const fromMetadata = user.user_metadata?.username ?? user.user_metadata?.name ?? user.user_metadata?.full_name;
  if (fromMetadata && fromMetadata.trim().length > 0) return fromMetadata;
  if (user.email && user.email.includes("@")) return user.email.split("@")[0];
  return "Not set";
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const username = getUsername({
    email: user.email,
    user_metadata: {
      username: user.user_metadata?.username,
      name: user.user_metadata?.name,
      full_name: user.user_metadata?.full_name,
    },
  });

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <span className="topbar-title">Settings</span>
        </div>
      </div>

      <div className="content">
        <div className="card fade-up" style={{ maxWidth: 560 }}>
          <div className="section-heading">Account</div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "160px 1fr",
              gap: 10,
              alignItems: "center",
              padding: "8px 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div style={{ color: "var(--ink-3)", fontSize: 12, fontWeight: 500 }}>Username</div>
            <div style={{ fontSize: 14, color: "var(--ink)" }}>{username}</div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "160px 1fr",
              gap: 10,
              alignItems: "center",
              padding: "10px 0 2px",
            }}
          >
            <div style={{ color: "var(--ink-3)", fontSize: 12, fontWeight: 500 }}>Email</div>
            <div style={{ fontSize: 14, color: "var(--ink)" }}>{user.email ?? "Not set"}</div>
          </div>
        </div>
      </div>
    </>
  );
}
