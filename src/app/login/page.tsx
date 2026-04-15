"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/dashboard");
      }
    }

    checkSession();
  }, [router, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
      return;
    }

    const emailRedirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Signup complete. Check your email if confirmation is enabled.");
    setLoading(false);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem 1rem",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 440,
          borderRadius: 14,
          border: "1px solid #e5e7eb",
          background: "#fff",
          padding: "1.5rem",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 30 }}>Secure Login</h1>
        <p style={{ marginTop: 8, marginBottom: 18, color: "#4b5563" }}>
          Sign in with Supabase to access your dashboard.
        </p>

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <button
            onClick={() => setMode("login")}
            style={{
              flex: 1,
              border: "1px solid #d1d5db",
              borderRadius: 8,
              padding: "8px 12px",
              background: mode === "login" ? "#111827" : "#fff",
              color: mode === "login" ? "#fff" : "#111827",
              cursor: "pointer",
            }}
            type="button"
          >
            Login
          </button>
          <button
            onClick={() => setMode("signup")}
            style={{
              flex: 1,
              border: "1px solid #d1d5db",
              borderRadius: 8,
              padding: "8px 12px",
              background: mode === "signup" ? "#111827" : "#fff",
              color: mode === "signup" ? "#fff" : "#111827",
              cursor: "pointer",
            }}
            type="button"
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            autoComplete="email"
            style={{ padding: "10px 12px" }}
          />
          <input
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={6}
            style={{ padding: "10px 12px" }}
          />

          <button
            disabled={loading}
            type="submit"
            style={{
              border: "none",
              borderRadius: 8,
              padding: "10px 12px",
              background: "#111827",
              color: "#fff",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
          </button>
        </form>

        {message ? (
          <p style={{ marginTop: 12, color: "#374151", fontSize: 14 }}>{message}</p>
        ) : null}
      </section>
    </main>
  );
}
