import Image from "next/image";
import Link from "next/link";

export default function Nav() {
  return (
    <nav
      className="glass"
      style={{
        position: "fixed",
        top: "1rem",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(calc(100vw - 2rem), 1100px)",
        zIndex: 50,
        padding: "0.75rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Image
          src="/brand/roots-logo.jpg"
          alt="ROOTS"
          width={36}
          height={36}
          style={{ borderRadius: "6px", objectFit: "cover" }}
        />
        <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>×</span>
        <Image
          src="/brand/miuc-logo.jpg"
          alt="MIUC"
          width={36}
          height={36}
          style={{ borderRadius: "6px", objectFit: "cover" }}
        />
        <span
          className="display"
          style={{
            fontSize: "1rem",
            color: "var(--text-primary)",
            marginLeft: "0.25rem",
          }}
        >
          The Colosseum
        </span>
      </div>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <Link
          href="/about"
          style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}
        >
          About
        </Link>
        <Link
          href="/games"
          style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}
        >
          Games
        </Link>
        <Link href="/register" className="btn-primary" style={{ fontSize: "0.875rem", padding: "0.5rem 1.2rem" }}>
          Register
        </Link>
      </div>
    </nav>
  );
}
