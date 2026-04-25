import { Suspense } from "react";
import LoginClient from "./login-client";

export default function LoginPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const normalizedSiteUrl = configuredSiteUrl
    ? configuredSiteUrl.startsWith("http") ? configuredSiteUrl : `https://${configuredSiteUrl}`
    : null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/dashboard");
    });
  }, [router, supabase]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(""); setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setMessage(error.message); setLoading(false); return; }
      router.push("/dashboard"); router.refresh(); return;
    }

    const redirectBaseUrl = normalizedSiteUrl ?? window.location.origin;
    const redirectUrl = new URL("/auth/callback", redirectBaseUrl);
    redirectUrl.searchParams.set("next", "/dashboard");
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectUrl.toString() } });
    if (error) { setMessage(error.message); setLoading(false); return; }
    setMessage("Account created! Check your email to confirm."); setLoading(false);
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#0d0f12",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
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
          <div style={{ color: "#fff", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 18 }}>Money Manager</div>
          <div style={{ color: "#4a5162", fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginTop: 4 }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "#14171d",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: "28px 28px 24px",
        }}>
          {/* Tab toggle */}
          <div style={{
            display: "flex", gap: 0,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8,
            padding: 3,
            marginBottom: 24,
          }}>
            {(["login", "signup"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1,
                padding: "8px 12px",
                border: "none",
                borderRadius: 6,
                background: mode === m ? "#fff" : "transparent",
                color: mode === m ? "#0d0f12" : "#4a5162",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, fontWeight: mode === m ? 500 : 400,
                cursor: "pointer",
                transition: "all 0.13s",
              }}>
                {m === "login" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={{ display: "block", marginBottom: 5, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#8a909e" }}>Email address</label>
              <input
                required type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" autoComplete="email"
                style={{
                  width: "100%", padding: "10px 14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, color: "#fff",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                  outline: "none",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 5, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#8a909e" }}>Password</label>
              <input
                required type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "Min. 6 characters" : "••••••••"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={6}
                style={{
                  width: "100%", padding: "10px 14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, color: "#fff",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                  outline: "none",
                }}
              />
            </div>

            <button disabled={loading} type="submit" style={{
              width: "100%",
              padding: "11px",
              marginTop: 4,
              border: "none",
              borderRadius: 8,
              background: loading ? "#2d3748" : "#fff",
              color: loading ? "#6b7280" : "#0d0f12",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.13s",
            }}>
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          {message && (
            <div style={{
              marginTop: 16, padding: "10px 14px",
              background: message.includes("created") ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)",
              border: `1px solid ${message.includes("created") ? "rgba(22,163,74,0.25)" : "rgba(220,38,38,0.25)"}`,
              borderRadius: 8, color: message.includes("created") ? "#4ade80" : "#f87171",
              fontFamily: "'DM Sans', sans-serif", fontSize: 13,
            }}>
              {message}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
