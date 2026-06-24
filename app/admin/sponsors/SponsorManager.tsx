"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addSponsor, toggleSponsor } from "../actions";

type Sponsor = {
  id: string;
  name: string;
  tier: "title" | "platinum" | "gold" | "silver" | "in_kind";
  websiteUrl: string | null;
  logoUrl: string | null;
  displayOrder: number;
  active: boolean;
};

const TIERS = [
  { value: "title",    label: "Title Partner" },
  { value: "platinum", label: "Platinum" },
  { value: "gold",     label: "Gold" },
  { value: "silver",   label: "Silver" },
  { value: "in_kind",  label: "In-Kind" },
] as const;

const TIER_COLORS: Record<string, string> = {
  title:    "var(--gold)",
  platinum: "var(--text-primary)",
  gold:     "var(--gold)",
  silver:   "var(--text-muted)",
  in_kind:  "var(--teal)",
};

export default function SponsorManager({ sponsors }: { sponsors: Sponsor[] }) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "", tier: "gold" as Sponsor["tier"],
    websiteUrl: "", logoUrl: "", displayOrder: "0",
  });
  const [adding,  setAdding]  = useState(false);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleAdd() {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setLoading(true); setError("");
    const result = await addSponsor({
      name: form.name,
      tier: form.tier,
      websiteUrl: form.websiteUrl || undefined,
      logoUrl: form.logoUrl || undefined,
      displayOrder: parseInt(form.displayOrder, 10) || 0,
    });
    if (result.success) {
      setForm({ name: "", tier: "gold", websiteUrl: "", logoUrl: "", displayOrder: "0" });
      setAdding(false);
      router.refresh();
    } else {
      setError(result.error ?? "Failed to add sponsor.");
    }
    setLoading(false);
  }

  async function handleToggle(id: string, active: boolean) {
    await toggleSponsor(id, active);
    router.refresh();
  }

  const inputStyle = {
    background: "rgba(20,35,50,0.7)", border: "1px solid var(--border-glass)",
    borderRadius: "10px", padding: "0.7rem 1rem", color: "var(--text-primary)",
    fontSize: "0.875rem", fontFamily: "var(--font-body)", outline: "none", width: "100%",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* Add sponsor */}
      {!adding ? (
        <button className="btn-primary" style={{ alignSelf: "flex-start" }} onClick={() => setAdding(true)}>
          + Add Sponsor
        </button>
      ) : (
        <div className="glass glass--gold" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p className="eyebrow" style={{ color: "var(--gold)" }}>New Sponsor</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                Name <span style={{ color: "var(--red-arena)" }}>*</span>
              </label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Coca-Cola Pakistan" style={inputStyle} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>Tier</label>
              <select value={form.tier} onChange={(e) => set("tier", e.target.value as Sponsor["tier"])} style={inputStyle}>
                {TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>Website URL</label>
              <input value={form.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} placeholder="https://…" style={inputStyle} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>Display Order</label>
              <input type="number" value={form.displayOrder} onChange={(e) => set("displayOrder", e.target.value)} placeholder="0" style={inputStyle} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>Logo URL (optional — leave blank for text card)</label>
              <input value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} placeholder="https://cdn…/logo.png" style={inputStyle} />
            </div>
          </div>

          {error && <p style={{ color: "var(--red-arena)", fontSize: "0.82rem" }}>{error}</p>}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="btn-primary" style={{ fontSize: "0.875rem", opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={handleAdd}>
              {loading ? "Saving…" : "Save Sponsor"}
            </button>
            <button className="btn-ghost" style={{ fontSize: "0.875rem" }} onClick={() => { setAdding(false); setError(""); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sponsor list */}
      {sponsors.length === 0 ? (
        <div className="glass" style={{ padding: "2rem", textAlign: "center", color: "var(--text-faint)" }}>
          No sponsors yet. Add the first one above.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {sponsors.map((s) => (
            <div
              key={s.id}
              className="glass"
              style={{
                padding: "1.25rem 1.5rem",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: "1rem", opacity: s.active ? 1 : 0.5,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-primary)" }}>
                  {s.name}
                </span>
                <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: TIER_COLORS[s.tier] }}>
                  {TIERS.find((t) => t.value === s.tier)?.label}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {s.websiteUrl && (
                  <a href={s.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.8rem", color: "var(--teal)" }}>
                    ↗ Site
                  </a>
                )}
                <button
                  onClick={() => handleToggle(s.id, !s.active)}
                  style={{
                    fontSize: "0.75rem", padding: "0.35rem 0.8rem", borderRadius: "999px",
                    border: `1px solid ${s.active ? "var(--red-arena)" : "var(--teal)"}`,
                    color: s.active ? "var(--red-arena)" : "var(--teal)",
                    background: "transparent", cursor: "pointer",
                  }}
                >
                  {s.active ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
