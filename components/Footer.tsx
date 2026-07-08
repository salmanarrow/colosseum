import Image from "next/image";
import Link from "next/link";

// TODO: add real social handles once confirmed
const SOCIALS: { label: string; href: string; icon: string }[] = [];

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border-glass)",
        padding: "4rem 1.5rem 2.5rem",
        color: "var(--text-faint)",
        fontSize: "0.8rem",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* Top row — logos + nav + socials */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "2.5rem",
            marginBottom: "3rem",
          }}
        >
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <Image src="/brand/miuc-logo.png" alt="MIUC" width={3086} height={1820} style={{ height: "34px", width: "auto" }} />
              <span style={{ color: "var(--text-faint)" }}>×</span>
              <Image src="/brand/roots-logo-white.png" alt="ROOTS" width={263} height={70} style={{ height: "22px", width: "auto" }} />
            </div>
            <p style={{ lineHeight: 1.65, color: "var(--text-faint)", fontSize: "0.78rem" }}>
              Pakistan's premier collegiate e-sports championship.<br />
              Aug 7 – 9, 2026 · MIUC Flagship Campus H-8, Islamabad
            </p>
          </div>

          {/* Nav */}
          <div>
            <p style={{ fontFamily: "var(--font-body)", letterSpacing: "0.2em", textTransform: "uppercase", fontSize: "0.7rem", color: "var(--teal)", marginBottom: "1rem" }}>
              Navigate
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                ["About", "/about"],
                ["Vision", "/vision"],
                ["Games", "/games"],
                ["Sponsors", "/sponsors"],
                ["Register", "/register"],
                ["Compete (External)", "/compete"],
                ["Tickets", "/tickets"],
              ].map(([label, href]) => (
                <Link key={href} href={href} style={{ color: "var(--text-muted)", transition: "color 0.15s" }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Socials */}
          <div>
            <p style={{ fontFamily: "var(--font-body)", letterSpacing: "0.2em", textTransform: "uppercase", fontSize: "0.7rem", color: "var(--teal)", marginBottom: "1rem" }}>
              Follow Us
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", fontSize: "0.85rem" }}
                >
                  <span>{s.icon}</span>
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Contact / Sponsor */}
          <div>
            <p style={{ fontFamily: "var(--font-body)", letterSpacing: "0.2em", textTransform: "uppercase", fontSize: "0.7rem", color: "var(--teal)", marginBottom: "1rem" }}>
              Get Involved
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <Link href="/sponsor-inquiry" style={{ color: "var(--text-muted)" }}>Become a Sponsor</Link>
              <Link href="/sponsor-inquiry" style={{ color: "var(--text-muted)" }}>Media Partnership</Link>
              <Link href="/compete" style={{ color: "var(--red-arena)" }}>External University Entry</Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: "1px solid var(--border-glass)",
            paddingTop: "1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <p style={{ fontFamily: "var(--font-mono)" }}>
            © 2026 The Colosseum · Organized by MIUC · thecolosseumpk.vercel.app
          </p>
          <p style={{ fontFamily: "var(--font-mono)", color: "var(--text-faint)" }}>
            Hosted at MIUC Flagship Campus H-8, Islamabad
          </p>
        </div>
      </div>
    </footer>
  );
}
