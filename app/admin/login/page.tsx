"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError("Invalid credentials. Try again.");
      setLoading(false);
    } else {
      router.push("/admin/payments");
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div className="blob blob--purple" style={{ width: 400, height: 400, top: "-80px", right: "-80px" }} />
      <div className="blob blob--teal"   style={{ width: 300, height: 300, bottom: "-60px", left: "-60px" }} />

      <div className="glass" style={{ padding: "2.5rem", width: "100%", maxWidth: "400px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
          <Image
            src="/brand/colosseum-wordmark.png"
            alt="The Colosseum"
            width={1600}
            height={689}
            style={{ height: "28px", width: "auto" }}
          />
        </div>

        <p className="eyebrow" style={{ textAlign: "center", marginBottom: "0.5rem" }}>Admin Access</p>
        <h1 className="display" style={{ textAlign: "center", fontSize: "2rem", marginBottom: "2rem" }}>
          Sign In
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@thecolosseum.pk"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{
                background: "rgba(20,35,50,0.7)", border: "1px solid var(--border-glass)",
                borderRadius: "10px", padding: "0.75rem 1rem", color: "var(--text-primary)",
                fontSize: "0.95rem", outline: "none", fontFamily: "var(--font-body)",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{
                background: "rgba(20,35,50,0.7)", border: "1px solid var(--border-glass)",
                borderRadius: "10px", padding: "0.75rem 1rem", color: "var(--text-primary)",
                fontSize: "0.95rem", outline: "none", fontFamily: "var(--font-body)",
              }}
            />
          </div>

          {error && (
            <p style={{ color: "var(--red-arena)", fontSize: "0.82rem", textAlign: "center" }}>{error}</p>
          )}

          <button
            type="button"
            className="btn-primary"
            style={{ justifyContent: "center", marginTop: "0.5rem", opacity: loading ? 0.6 : 1 }}
            disabled={loading}
            onClick={handleLogin}
          >
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </div>
      </div>
    </main>
  );
}
