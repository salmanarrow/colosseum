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
          src="/brand/roots-logo.jpg"
          alt="ROOTS"
          width={24}
          height={24}
          style={{ borderRadius: "4px" }}
        />
        <span style={{ color: "var(--text-muted)" }}>×</span>
        <Image
          src="/brand/miuc-logo.jpg"
          alt="MIUC"
          width={24}
          height={24}
          style={{ borderRadius: "4px" }}
        />
      </div>
      <p style={{ fontFamily: "var(--font-mono)" }}>
        © 2026 ROOTS International Schools &amp; Colleges × MIUC · thecolosseum.pk
      </p>
    </footer>
  );
}
