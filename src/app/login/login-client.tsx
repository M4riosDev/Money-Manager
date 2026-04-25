"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function formatAuthError(rawMessage: string) {
  const normalized = rawMessage.toLowerCase();
  if (normalized.includes("invalid login credentials")) {
    return "No account found with these credentials, or password is incorrect.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }
  if (normalized.includes("user already registered")) {
    return "An account with this email already exists. Try signing in.";
  }
  return rawMessage;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "#fff",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 14,
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 5,
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 12,
  color: "#8a909e",
};

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createClient());
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const normalizedSiteUrl = configuredSiteUrl
    ? configuredSiteUrl.startsWith("http") ? configuredSiteUrl : `https://${configuredSiteUrl}`
    : null;

  const callbackMessage = useMemo(() => {
    const errorCode = searchParams.get("error");
    const errorMessage = searchParams.get("message");
    if (!errorCode) return "";
    if (errorCode === "missing_code") return "Missing verification code. Please retry from your email link.";
    if (errorCode === "missing_supabase_config") return "Server auth config is missing. Check your environment variables.";
    if (errorCode === "auth_callback_failed") {
      if (errorMessage) return formatAuthError(errorMessage);
      return "Verification failed. Please try signing in again.";
    }
    return errorMessage ?? "Authentication failed. Please try again.";
  }, [searchParams]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/dashboard");
    });
  }, [router, supabase]);

  // reset fields when switching mode
  useEffect(() => {
    setMessage("");
    setUsername("");
    setEmail("");
    setPassword("");
  }, [mode]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(formatAuthError(error.message));
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
      return;
    }

    // signup
    const redirectBaseUrl = normalizedSiteUrl ?? window.location.origin;
    const redirectUrl = new URL("/auth/callback", redirectBaseUrl);
    redirectUrl.searchParams.set("next", "/dashboard");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl.toString(),
        data: { username: username.trim() },
      },
    });

    if (error) {
      setMessage(formatAuthError(error.message));
      setLoading(false);
      return;
    }

    setMessage("Account created! Check your email to confirm.");
    setLoading(false);
  }

  const isSuccess = (message || callbackMessage).toLowerCase().includes("created");

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0d0f12",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            aria-label="Money Manager logo"
            role="img"
            style={{
              width: 72,
              height: 72,
              borderRadius: 12,
              marginBottom: 12,
              display: "inline-block",
              backgroundImage: "url('/favicon.ico')",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              backgroundSize: "220%",
            }}
          />
          <div style={{ color: "#fff", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 18 }}>
            Money Manager
          </div>
          <div style={{ color: "#4a5162", fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginTop: 4 }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </div>
        </div>

        <div
          style={{
            background: "#14171d",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: "28px 28px 24px",
          }}
        >
          {/* Tab switcher */}
          <div
            style={{
              display: "flex",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 8,
              padding: 3,
              marginBottom: 24,
            }}
          >
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: 6,
                  background: mode === m ? "#fff" : "transparent",
                  color: mode === m ? "#0d0f12" : "#4a5162",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: mode === m ? 500 : 400,
                  cursor: "pointer",
                  transition: "all 0.13s",
                }}
              >
                {m === "login" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>

            {/* Username — signup only */}
            {mode === "signup" && (
              <div>
                <label style={labelStyle}>Username</label>
                <input
                  required
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  autoComplete="username"
                  minLength={3}
                  style={inputStyle}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label style={labelStyle}>Email address</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                style={inputStyle}
              />
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Password</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "Min. 6 characters" : "••••••••"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={6}
                style={inputStyle}
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              style={{
                width: "100%",
                padding: "11px",
                marginTop: 4,
                border: "none",
                borderRadius: 8,
                background: loading ? "#2d3748" : "#fff",
                color: loading ? "#6b7280" : "#0d0f12",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.13s",
              }}
            >
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          {(message || callbackMessage) && (
            <div
              style={{
                marginTop: 16,
                padding: "10px 14px",
                background: isSuccess ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)",
                border: `1px solid ${isSuccess ? "rgba(22,163,74,0.25)" : "rgba(220,38,38,0.25)"}`,
                borderRadius: 8,
                color: isSuccess ? "#4ade80" : "#f87171",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
              }}
            >
              {message || callbackMessage}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
