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
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
        <Image
          src="/brand/roots-logo-white.png"
          alt="ROOTS International"
          width={263}
          height={70}
          style={{ height: "26px", width: "auto" }}
        />
        <span style={{ color: "var(--text-faint)", fontSize: "1rem" }}>×</span>
        <Image
          src="/brand/miuc-logo.png"
          alt="MIUC"
          width={3086}
          height={1820}
          style={{ height: "40px", width: "auto" }}
        />
      </Link>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <Link
          href="/about"
          style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}
        >
          About
        </Link>
        <Link
          href="/vision"
          style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}
        >
          Vision
        </Link>
        <Link
          href="/games"
          style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}
        >
          Games
        </Link>
        <Link
          href="/sponsors"
          style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}
        >
          Sponsors
        </Link>
        <Link href="/register" className="btn-primary" style={{ fontSize: "0.875rem", padding: "0.5rem 1.2rem" }}>
          Register
        </Link>
      </div>
    </nav>
  );
}
