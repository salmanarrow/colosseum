"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { verifyAdminAccess } from "./actions";

const NAV = [
  { href: "/admin/payments",      label: "Payment Queue",   icon: "💳" },
  { href: "/admin/registrations", label: "Registrations",   icon: "📋" },
  { href: "/admin/scan",          label: "Gate Scanner",    icon: "📷" },
  { href: "/admin/sponsors",      label: "Sponsors",        icon: "🤝" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [denied, setDenied]     = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (pathname === "/admin/login") return;
      if (!data.session) {
        router.replace("/admin/login");
        return;
      }
      // Server-side check: token must belong to a user in the admins table.
      const result = await verifyAdminAccess(data.session.access_token);
      if (result.authorized) {
        setChecking(false);
      } else {
        setDenied(true);
        setChecking(false);
      }
    });
  }, [pathname, router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  if (pathname === "/admin/login") return <>{children}</>;
  if (checking) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>Checking auth…</p>
      </main>
    );
  }
  if (denied) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div className="glass glass--red" style={{ padding: "2.5rem", maxWidth: 420, textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🚫</div>
          <p className="eyebrow" style={{ color: "var(--red-arena)", marginBottom: "0.5rem" }}>Access Denied</p>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            Your account is signed in but not registered as an event admin.
            Contact the committee lead to be added.
          </p>
          <button className="btn-ghost" onClick={signOut} style={{ justifyContent: "center", width: "100%" }}>
            Sign Out
          </button>
        </div>
      </main>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside
        className="glass"
        style={{
          width: "220px",
          flexShrink: 0,
          padding: "1.5rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          borderRadius: 0,
          borderRight: "1px solid var(--border-glass)",
          borderTop: "none",
          borderBottom: "none",
          borderLeft: "none",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <div style={{ marginBottom: "1.5rem", paddingLeft: "0.5rem" }}>
          <Image
            src="/brand/colosseum-wordmark.png"
            alt="The Colosseum"
            width={1600}
            height={689}
            style={{ height: "22px", width: "auto" }}
          />
          <p style={{ fontSize: "0.65rem", color: "var(--text-faint)", marginTop: "0.35rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Admin
          </p>
        </div>

        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex", alignItems: "center", gap: "0.6rem",
                padding: "0.6rem 0.75rem", borderRadius: "10px",
                background: active ? "rgba(0,194,168,0.12)" : "transparent",
                color: active ? "var(--teal)" : "var(--text-muted)",
                fontSize: "0.875rem", fontWeight: active ? 600 : 400,
                textDecoration: "none", transition: "all 0.15s",
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        <div style={{ marginTop: "auto" }}>
          <div style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "1rem" }}>
            <Link
              href="/"
              style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.75rem", color: "var(--text-faint)", fontSize: "0.8rem", textDecoration: "none" }}
            >
              ← Back to Site
            </Link>
            <button
              onClick={signOut}
              style={{
                display: "flex", alignItems: "center", gap: "0.6rem",
                padding: "0.5rem 0.75rem", color: "var(--red-arena)", fontSize: "0.8rem",
                background: "transparent", border: "none", cursor: "pointer", width: "100%",
              }}
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}
