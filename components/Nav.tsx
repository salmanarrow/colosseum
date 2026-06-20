"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/vision", label: "Vision" },
  { href: "/games", label: "Games" },
  { href: "/sponsors", label: "Sponsors" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

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
        padding: "0.7rem 1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Link
        href="/"
        onClick={() => setOpen(false)}
        style={{ display: "flex", alignItems: "center" }}
      >
        <Image
          src="/brand/colosseum-wordmark.png"
          alt="The Colosseum"
          width={1600}
          height={689}
          priority
          className="nav-wordmark"
        />
      </Link>

      {/* Desktop links */}
      <div className="nav-links-desktop" style={{ gap: "0.75rem", alignItems: "center" }}>
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}
          >
            {l.label}
          </Link>
        ))}
        <Link
          href="/register"
          className="btn-primary"
          style={{ fontSize: "0.875rem", padding: "0.5rem 1.2rem" }}
        >
          Register
        </Link>
      </div>

      {/* Mobile hamburger */}
      <button
        className="nav-burger"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--text-primary)",
          cursor: "pointer",
          padding: "0.25rem",
          display: "none",
          alignItems: "center",
        }}
      >
        {open ? <X size={26} /> : <Menu size={26} />}
      </button>

      {/* Mobile dropdown */}
      {open && (
        <div
          className="glass nav-mobile-menu"
          style={{
            position: "absolute",
            top: "calc(100% + 0.6rem)",
            left: 0,
            right: 0,
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.35rem",
          }}
        >
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{
                color: "var(--text-primary)",
                fontSize: "1rem",
                padding: "0.65rem 0.5rem",
                borderRadius: "10px",
              }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/register"
            onClick={() => setOpen(false)}
            className="btn-primary"
            style={{ justifyContent: "center", marginTop: "0.4rem" }}
          >
            Register
          </Link>
        </div>
      )}
    </nav>
  );
}
