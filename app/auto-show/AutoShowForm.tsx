"use client";

import { useState } from "react";
import { submitAutoShowRegistration, uploadCarPhoto } from "./actions";

const CATEGORIES = [
  "Modified / Tuned",
  "Classic / Vintage",
  "Sports / Supercar",
  "JDM",
  "Off-road / 4x4",
  "Bike / Superbike",
  "Stock / Showroom",
  "Other",
];

type State = {
  ownerName: string; ownerEmail: string; ownerPhone: string; institutionName: string;
  carMake: string; carModel: string; carYear: string; plateNumber: string;
  category: string; modifications: string; consent: boolean;
};

const INITIAL: State = {
  ownerName: "", ownerEmail: "", ownerPhone: "", institutionName: "",
  carMake: "", carModel: "", carYear: "", plateNumber: "",
  category: "", modifications: "", consent: false,
};

function Field({
  label, value, onChange, placeholder, type = "text", required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <label style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>
        {label}{required && <span style={{ color: "var(--red-arena)", marginLeft: "0.25rem" }}>*</span>}
      </label>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "rgba(22,18,32,0.7)", border: "1px solid var(--border-glass)",
          borderRadius: "10px", padding: "0.75rem 1rem", color: "var(--text-primary)",
          fontSize: "0.95rem", outline: "none", width: "100%", fontFamily: "var(--font-body)",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--violet)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--border-glass)")}
      />
    </div>
  );
}

export default function AutoShowForm() {
  const [f, setF] = useState<State>(INITIAL);
  const [photo, setPhoto] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const set = (k: keyof State, v: unknown) => setF((s) => ({ ...s, [k]: v }));

  function validate() {
    const e: Record<string, string> = {};
    if (!f.ownerName.trim()) e.ownerName = "Required";
    if (!/\S+@\S+\.\S+/.test(f.ownerEmail)) e.ownerEmail = "Enter a valid email";
    if (!f.ownerPhone.trim()) e.ownerPhone = "Required";
    if (!f.carMake.trim()) e.carMake = "Required";
    if (!f.carModel.trim()) e.carModel = "Required";
    if (!f.plateNumber.trim()) e.plateNumber = "Required";
    if (!f.consent) e.consent = "Please confirm before submitting";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  if (done) {
    return (
      <div className="glass glass--gold" style={{ padding: "3rem 2rem", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏁</div>
        <h2 className="display" style={{ fontSize: "2.2rem", marginBottom: "0.75rem" }}>Application Received</h2>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "1.25rem" }}>
          The Auto Show is <strong style={{ color: "var(--silver)" }}>invite only</strong>, so every entry
          is reviewed by our team. If your car is selected you&apos;ll receive a
          <strong style={{ color: "var(--violet)" }}> vehicle gate pass</strong> by email.
        </p>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-faint)" }}>
          Watch {f.ownerEmail}
        </p>
      </div>
    );
  }

  return (
    <div className="glass" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div>
        <h2 className="display" style={{ fontSize: "1.8rem", marginBottom: "0.35rem" }}>Exhibitor Details</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.6 }}>
          Free to exhibit — we only ask that you tell us about the car. Entries are reviewed before approval.
        </p>
      </div>

      <Field label="Your Name" value={f.ownerName} onChange={(v) => set("ownerName", v)} placeholder="Muhammad Ali" required />
      {errors.ownerName && <p style={{ color: "var(--red-arena)", fontSize: "0.78rem", marginTop: "-0.6rem" }}>{errors.ownerName}</p>}

      <Field label="Email" value={f.ownerEmail} onChange={(v) => set("ownerEmail", v)} type="email" placeholder="you@example.com" required />
      {errors.ownerEmail && <p style={{ color: "var(--red-arena)", fontSize: "0.78rem", marginTop: "-0.6rem" }}>{errors.ownerEmail}</p>}

      <Field label="Phone" value={f.ownerPhone} onChange={(v) => set("ownerPhone", v)} type="tel" placeholder="03xx-xxxxxxx" required />
      {errors.ownerPhone && <p style={{ color: "var(--red-arena)", fontSize: "0.78rem", marginTop: "-0.6rem" }}>{errors.ownerPhone}</p>}

      <Field label="Institution / Club (optional)" value={f.institutionName} onChange={(v) => set("institutionName", v)} placeholder="e.g. MIUC, or your car club" />

      <div style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "1.25rem" }}>
        <p className="eyebrow" style={{ marginBottom: "1rem" }}>The Car</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
          <div>
            <Field label="Make" value={f.carMake} onChange={(v) => set("carMake", v)} placeholder="e.g. Toyota" required />
            {errors.carMake && <p style={{ color: "var(--red-arena)", fontSize: "0.78rem" }}>{errors.carMake}</p>}
          </div>
          <div>
            <Field label="Model" value={f.carModel} onChange={(v) => set("carModel", v)} placeholder="e.g. Supra" required />
            {errors.carModel && <p style={{ color: "var(--red-arena)", fontSize: "0.78rem" }}>{errors.carModel}</p>}
          </div>
          <Field label="Year" value={f.carYear} onChange={(v) => set("carYear", v)} placeholder="e.g. 1998" />
          <div>
            <Field label="Registration Plate" value={f.plateNumber} onChange={(v) => set("plateNumber", v)} placeholder="e.g. ABC-123" required />
            {errors.plateNumber && <p style={{ color: "var(--red-arena)", fontSize: "0.78rem" }}>{errors.plateNumber}</p>}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <label style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>Category</label>
        <select
          value={f.category} onChange={(e) => set("category", e.target.value)}
          style={{
            background: "rgba(22,18,32,0.7)", border: "1px solid var(--border-glass)",
            borderRadius: "10px", padding: "0.75rem 1rem",
            color: f.category ? "var(--text-primary)" : "var(--text-faint)",
            fontSize: "0.95rem", width: "100%",
          }}
        >
          <option value="">Select a category</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <label style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          Modifications / What makes it special
        </label>
        <textarea
          value={f.modifications} onChange={(e) => set("modifications", e.target.value)}
          rows={3} placeholder="Engine swaps, body kit, wrap, interior, build story…"
          style={{
            background: "rgba(22,18,32,0.7)", border: "1px solid var(--border-glass)",
            borderRadius: "10px", padding: "0.75rem 1rem", color: "var(--text-primary)",
            fontSize: "0.95rem", outline: "none", width: "100%", fontFamily: "var(--font-body)", resize: "vertical",
          }}
        />
      </div>

      {/* Photo */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <label style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          Photo of the car <span style={{ color: "var(--text-faint)", textTransform: "none", letterSpacing: 0 }}>(strongly recommended — helps selection)</span>
        </label>
        <label style={{
          display: "flex", alignItems: "center", gap: "0.75rem",
          background: "rgba(22,18,32,0.7)",
          border: `1px dashed ${photo ? "var(--violet)" : "var(--border-glass)"}`,
          borderRadius: "10px", padding: "0.85rem 1rem", cursor: "pointer",
        }}>
          <input
            type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              if (file && file.size > 8 * 1024 * 1024) { setErr("Photo must be under 8 MB."); return; }
              setErr(""); setPhoto(file);
            }}
          />
          <span style={{ fontSize: "1.2rem" }}>{photo ? "🚗" : "📎"}</span>
          <span style={{ fontSize: "0.85rem", color: photo ? "var(--violet)" : "var(--text-muted)" }}>
            {photo ? `${photo.name} (${(photo.size / 1024).toFixed(0)} KB)` : "Attach a photo of your car"}
          </span>
        </label>
      </div>

      <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer" }}>
        <input
          type="checkbox" checked={f.consent} onChange={(e) => set("consent", e.target.checked)}
          style={{ width: 18, height: 18, accentColor: "var(--violet)", cursor: "pointer", marginTop: 2, flexShrink: 0 }}
        />
        <span style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.5 }}>
          I confirm I own or have permission to exhibit this vehicle, and I understand the
          Auto Show is <strong style={{ color: "var(--text-primary)" }}>invite only</strong> and subject to approval.
        </span>
      </label>
      {errors.consent && <p style={{ color: "var(--red-arena)", fontSize: "0.78rem", marginTop: "-0.6rem" }}>{errors.consent}</p>}

      {err && <p style={{ color: "var(--red-arena)", fontSize: "0.85rem", textAlign: "center" }}>{err}</p>}

      <button
        type="button" className="btn-primary" disabled={busy}
        style={{ justifyContent: "center", padding: "0.9rem", fontSize: "1rem", opacity: busy ? 0.6 : 1 }}
        onClick={async () => {
          if (!validate()) return;
          setBusy(true); setErr("");
          try {
            let photoPath: string | undefined;
            if (photo) {
              const fd = new FormData();
              fd.append("photo", photo);
              const up = await uploadCarPhoto(fd);
              if (!up.success) { setErr(up.error ?? "Photo upload failed."); setBusy(false); return; }
              photoPath = up.path;
            }
            const res = await submitAutoShowRegistration({
              ownerName: f.ownerName, ownerEmail: f.ownerEmail, ownerPhone: f.ownerPhone,
              institutionName: f.institutionName || undefined,
              carMake: f.carMake, carModel: f.carModel, carYear: f.carYear || undefined,
              plateNumber: f.plateNumber, category: f.category || undefined,
              modifications: f.modifications || undefined, photoPath,
            });
            if (res.success) setDone(true);
            else setErr(res.error ?? "Submission failed.");
          } finally { setBusy(false); }
        }}
      >
        {busy ? "Submitting…" : "🏁 Apply to Exhibit"}
      </button>
    </div>
  );
}
