import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border-glass)",
        padding: "3rem 1.5rem 2rem",
        textAlign: "center",
        color: "var(--text-faint)",
        fontSize: "0.8rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "1.5rem",
          flexWrap: "wrap",
          marginBottom: "1.5rem",
          fontFamily: "var(--font-body)",
        }}
      >
        <Link href="/about" style={{ color: "var(--text-muted)" }}>
          About
        </Link>
        <Link href="/vision" style={{ color: "var(--text-muted)" }}>
          Vision
        </Link>
        <Link href="/sponsors" style={{ color: "var(--text-muted)" }}>
          Sponsors
        </Link>
        <Link href="/register" style={{ color: "var(--text-muted)" }}>
          Register
        </Link>
        <Link href="/tickets" style={{ color: "var(--text-muted)" }}>
          Tickets
        </Link>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          alignItems: "center",
          marginBottom: "0.75rem",
        }}
      >
        <Image
          src="/brand/roots-logo-white.png"
          alt="ROOTS International"
          width={263}
          height={70}
          style={{ height: "22px", width: "auto" }}
        />
        <span style={{ color: "var(--text-faint)" }}>×</span>
        <Image
          src="/brand/miuc-logo.png"
          alt="MIUC"
          width={3086}
          height={1820}
          style={{ height: "26px", width: "auto" }}
        />
      </div>
      <p style={{ fontFamily: "var(--font-mono)" }}>
        © 2026 ROOTS International Schools &amp; Colleges × MIUC · thecolosseum.pk
      </p>
    </footer>
  );
}
