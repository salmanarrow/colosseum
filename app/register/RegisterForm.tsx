"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import { submitRegistration, getGameIdBySlug, uploadPaymentScreenshot } from "./actions";

// ── Constants ──────────────────────────────────────────────────────────────

// Internal institutions — strictly MIUC and ROOTS International (RIS) branches.
// Sourced from miuc.edu.pk/campus and rootsinternational.edu.pk/campuses.
const MIUC_CAMPUSES = [
  "Islamabad (H-8/4)",
  "Columbia Park, Islamabad",
  "Richmond, Islamabad (DHA-2)",
  "Wah Cantt",
  "Peshawar",
  "Askari, Lahore",
  "Abbottabad",
  "Sialkot",
];

const RIS_CAMPUSES = [
  "Wellington, Islamabad",
  "Liverpool, Islamabad",
  "Winchester, Islamabad",
  "Repton, Islamabad",
  "Richmond, Islamabad",
  "Columbia Park, Islamabad",
  "New PWD, Islamabad",
  "Claremont, Rawalpindi",
  "Rawal, Rawalpindi",
  "Gulzar-e-Quaid, Rawalpindi",
  "Gandhara, Wah Cantt",
  "Oakdale, Wah Cantt",
  "Monash, Abbottabad",
  "Zamrud, Peshawar",
  "Riverview, Muzaffarabad (AJK)",
  "Phoenix, Chakwal",
  "Palm Tree, Sialkot",
  "Askari, Lahore",
  "Sevenoaks, Lahore",
  "Kingswood, Karachi",
  "Hamilton, Karachi",
  "Gujranwala",
];

// participationFee = internal Gladiator upsell over the 1000 Citizen base.
// externalSurcharge = added on top of the internal total for external squads.
const GAMES = [
  { slug: "valorant",      name: "Valorant",      format: "5v5",         category: "flagship", isTeam: true,  teamSize: 5, maxSize: 6, baseFee: 1000, participationFee: 500, externalSurcharge: 500, emoji: "🎯" },
  { slug: "pubg-mobile",   name: "PUBG Mobile",   format: "4-man Squad", category: "flagship", isTeam: true,  teamSize: 4, maxSize: 4, baseFee: 1000, participationFee: 200, externalSurcharge: 300, emoji: "🔫" },
  { slug: "free-fire-max", name: "Free Fire MAX", format: "Squad",       category: "flagship", isTeam: true,  teamSize: 4, maxSize: 4, baseFee: 1000, participationFee: 200, externalSurcharge: 300, emoji: "🔥" },
  { slug: "tekken-8",      name: "Tekken 8",      format: "1v1",         category: "flagship", isTeam: false, teamSize: 1, maxSize: 1, baseFee: 1000, participationFee: 500, externalSurcharge: 500, emoji: "🥊" },
  { slug: "ea-fc-26",      name: "EA FC 26",      format: "1v1",         category: "flagship", isTeam: false, teamSize: 1, maxSize: 1, baseFee: 1000, participationFee: 0,   externalSurcharge: 500, emoji: "⚽" },
  { slug: "forza",         name: "Forza",         format: "Racing",      category: "festival", isTeam: false, teamSize: 1, maxSize: 1, baseFee: 1000, participationFee: 0,   externalSurcharge: 0,   emoji: "🏎️" },
  { slug: "chess",         name: "Chess",         format: "1v1",         category: "legacy",   isTeam: false, teamSize: 1, maxSize: 1, baseFee: 1000, participationFee: 0,   externalSurcharge: 0,   emoji: "♟️" },
  { slug: "ludo-star",     name: "Ludo Star",     format: "Casual",      category: "legacy",   isTeam: false, teamSize: 1, maxSize: 4, baseFee: 1000, participationFee: 0,   externalSurcharge: 0,   emoji: "🎲" },
  { slug: "carrom",        name: "Carrom",        format: "Casual",      category: "legacy",   isTeam: false, teamSize: 1, maxSize: 4, baseFee: 1000, participationFee: 0,   externalSurcharge: 0,   emoji: "🎳" },
];

// ── Types ──────────────────────────────────────────────────────────────────

type Teammate = { fullName: string; email: string; phone: string };

type FormState = {
  // Step 1
  fullName: string;
  email: string;
  phone: string;
  isInternal: boolean;            // true = MIUC/ROOTS student (any campus) → internal rate
  internalOrg: "" | "miuc" | "roots";
  institutionName: string;
  campusName: string;
  ageConfirmed: boolean;
  role: "observer" | "competitor";
  // Step 2
  gameSlug: string;
  teamName: string;
  teammates: Teammate[];
  // Step 3
  transactionRef: string;
};

const EMPTY_TEAMMATE: Teammate = { fullName: "", email: "", phone: "" };

const INITIAL: FormState = {
  fullName: "", email: "", phone: "",
  isInternal: false, internalOrg: "", institutionName: "", campusName: "",
  ageConfirmed: false, role: "observer",
  gameSlug: "", teamName: "", teammates: [],
  transactionRef: "",
};

// ── Input helper ───────────────────────────────────────────────────────────

function Field({
  label, value, onChange, type = "text", placeholder, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <label style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>
        {label}{required && <span style={{ color: "var(--red-arena)", marginLeft: "0.25rem" }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: "rgba(20,35,50,0.7)",
          border: "1px solid var(--border-glass)",
          borderRadius: "10px",
          padding: "0.75rem 1rem",
          color: "var(--text-primary)",
          fontSize: "0.95rem",
          outline: "none",
          width: "100%",
          fontFamily: "var(--font-body)",
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--teal)")}
        onBlur={(e)  => (e.target.style.borderColor = "var(--border-glass)")}
      />
    </div>
  );
}

function StepDot({ n, current }: { n: number; current: number }) {
  const done    = current > n;
  const active  = current === n;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem" }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: done ? "var(--teal)" : active ? "rgba(0,194,168,0.15)" : "rgba(20,35,50,0.8)",
        border: `2px solid ${done || active ? "var(--teal)" : "var(--border-glass)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.8rem", fontWeight: 700,
        color: done ? "#04211D" : active ? "var(--teal)" : "var(--text-faint)",
        transition: "all 0.2s",
      }}>
        {done ? "✓" : n}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function RegisterForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);

  const set = (key: keyof FormState, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const selectedGame = GAMES.find((g) => g.slug === form.gameSlug);
  const totalSteps   = form.role === "competitor" ? 4 : 3;

  // ── Validation ────────────────────────────────────────────────────────

  function validateStep1() {
    const e: Record<string, string> = {};
    if (!form.fullName.trim())   e.fullName = "Required";
    if (!form.email.trim())      e.email    = "Required";
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.phone.trim())      e.phone    = "Required";
    if (form.isInternal && !form.internalOrg) e.internalOrg = "Select MIUC or ROOTS";
    if (form.isInternal && !form.campusName.trim()) e.campusName = "Required";
    if (!form.isInternal && !form.institutionName.trim()) e.institutionName = "Required";
    if (!form.isInternal && !form.campusName.trim())      e.campusName      = "Required";
    if (!form.ageConfirmed) e.ageConfirmed = "You must confirm your age";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e: Record<string, string> = {};
    if (!form.gameSlug) { e.gameSlug = "Select a game"; setErrors(e); return false; }
    if (selectedGame?.isTeam && !form.teamName.trim()) e.teamName = "Required";
    if (selectedGame?.isTeam) {
      form.teammates.forEach((t, i) => {
        if (!t.fullName.trim()) e[`tm_name_${i}`] = "Required";
        if (!t.email.trim())    e[`tm_email_${i}`] = "Required";
        if (!t.phone.trim())    e[`tm_phone_${i}`] = "Required";
      });
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep3() {
    const e: Record<string, string> = {};
    if (!form.transactionRef.trim()) e.transactionRef = "Please enter your transaction reference or EasyPaisa number";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Navigation ────────────────────────────────────────────────────────

  function next() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && form.role === "competitor" && !validateStep2()) return;
    if (step === (form.role === "competitor" ? 3 : 2) && !validateStep3()) return;
    setStep((s) => s + 1);
  }

  function back() { setStep((s) => s - 1); setErrors({}); }

  // When game changes, reset teammates array to required size
  function handleGameChange(slug: string) {
    const g = GAMES.find((x) => x.slug === slug);
    set("gameSlug", slug);
    set("teamName", "");
    if (g?.isTeam) {
      // teammates = all members except captain (captain is the registrant)
      set("teammates", Array.from({ length: g.teamSize - 1 }, () => ({ ...EMPTY_TEAMMATE })));
    } else {
      set("teammates", []);
    }
  }

  function updateTeammate(i: number, field: keyof Teammate, value: string) {
    setForm((f) => {
      const updated = [...f.teammates];
      updated[i] = { ...updated[i], [field]: value };
      return { ...f, teammates: updated };
    });
  }

  // ── Fee calc ──────────────────────────────────────────────────────────

  // Internal = MIUC/ROOTS student (any campus). External = any other institution.
  const isExternal       = !form.isInternal;
  const baseFee          = 1000;
  const participationFee  = form.role === "competitor" ? (selectedGame?.participationFee ?? 0) : 0;
  const externalSurcharge = form.role === "competitor" && isExternal ? (selectedGame?.externalSurcharge ?? 0) : 0;
  const totalFee         = baseFee + participationFee + externalSurcharge;
  const paymentStep      = form.role === "competitor" ? 3 : 2;

  if (submitted) {
    return (
      <div className="glass glass--gold" style={{ padding: "3rem 2rem", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚔️</div>
        <h2 className="display" style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>You're Registered</h2>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
          Your registration is <strong style={{ color: "var(--gold)" }}>pending payment confirmation</strong>.<br />
          Once your payment is verified by the team, you'll receive your QR code for entry.
        </p>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-faint)" }}>
          Check your email at <strong style={{ color: "var(--teal)" }}>{form.email}</strong> for updates.
        </p>
      </div>
    );
  }

  const stepLabels = form.role === "competitor"
    ? ["Details", "Game & Team", "Payment", "Confirm"]
    : ["Details", "Payment", "Confirm"];

  return (
    <div>
      <Nav />

      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0", marginBottom: "2.5rem" }}>
        {stepLabels.map((label, idx) => (
          <div key={label} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
              <StepDot n={idx + 1} current={step} />
              <span style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: step === idx + 1 ? "var(--teal)" : "var(--text-faint)" }}>
                {label}
              </span>
            </div>
            {idx < stepLabels.length - 1 && (
              <div style={{ width: "3rem", height: "1px", background: step > idx + 1 ? "var(--teal)" : "var(--border-glass)", margin: "0 0.25rem", marginBottom: "1.2rem", transition: "background 0.2s" }} />
            )}
          </div>
        ))}
      </div>

      <div className="glass" style={{ padding: "2rem" }}>

        {/* ── STEP 1: Personal details ─────────────────────────────────── */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h2 className="display" style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Your Details</h2>

            <Field label="Full Name" value={form.fullName} onChange={(v) => set("fullName", v)} placeholder="Muhammad Ali" required />
            {errors.fullName && <p style={{ color: "var(--red-arena)", fontSize: "0.78rem", marginTop: "-0.75rem" }}>{errors.fullName}</p>}

            <Field label="Email Address" value={form.email} onChange={(v) => set("email", v)} type="email" placeholder="you@example.com" required />
            {errors.email && <p style={{ color: "var(--red-arena)", fontSize: "0.78rem", marginTop: "-0.75rem" }}>{errors.email}</p>}

            <Field label="Phone Number" value={form.phone} onChange={(v) => set("phone", v)} type="tel" placeholder="03xx-xxxxxxx" required />
            {errors.phone && <p style={{ color: "var(--red-arena)", fontSize: "0.78rem", marginTop: "-0.75rem" }}>{errors.phone}</p>}

            {/* Institution */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <label style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                Institution <span style={{ color: "var(--red-arena)" }}>*</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={form.isInternal}
                  onChange={(e) => { set("isInternal", e.target.checked); set("internalOrg", ""); set("institutionName", ""); set("campusName", ""); }}
                  style={{ width: 18, height: 18, accentColor: "var(--teal)", cursor: "pointer" }}
                />
                <span style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>
                  I am a current student of <strong style={{ color: "var(--teal)" }}>MIUC or ROOTS</strong> (any campus)
                </span>
              </label>

              {form.isInternal ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    {(["miuc", "roots"] as const).map((org) => (
                      <label
                        key={org}
                        style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                          padding: "0.7rem", borderRadius: "10px", cursor: "pointer",
                          border: `1px solid ${form.internalOrg === org ? "var(--teal)" : "var(--border-glass)"}`,
                          background: form.internalOrg === org ? "rgba(0,194,168,0.1)" : "rgba(20,35,50,0.5)",
                          transition: "all 0.15s",
                        }}
                      >
                        <input type="radio" name="internalOrg" value={org} checked={form.internalOrg === org} onChange={() => { set("internalOrg", org); set("campusName", ""); }} style={{ display: "none" }} />
                        <span style={{ color: form.internalOrg === org ? "var(--teal)" : "var(--text-muted)", fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.05em" }}>
                          {org.toUpperCase()}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.internalOrg && <p style={{ color: "var(--red-arena)", fontSize: "0.78rem" }}>{errors.internalOrg}</p>}
                  {form.internalOrg && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                        Campus <span style={{ color: "var(--red-arena)" }}>*</span>
                      </label>
                      <select
                        value={form.campusName}
                        onChange={(e) => set("campusName", e.target.value)}
                        style={{
                          background: "rgba(20,35,50,0.7)", border: "1px solid var(--border-glass)",
                          borderRadius: "10px", padding: "0.75rem 1rem", color: form.campusName ? "var(--text-primary)" : "var(--text-faint)",
                          fontSize: "0.95rem", width: "100%", fontFamily: "var(--font-body)",
                        }}
                      >
                        <option value="">Select your campus</option>
                        {(form.internalOrg === "miuc" ? MIUC_CAMPUSES : RIS_CAMPUSES).map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      {errors.campusName && <p style={{ color: "var(--red-arena)", fontSize: "0.78rem" }}>{errors.campusName}</p>}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <Field label="Institution Name" value={form.institutionName} onChange={(v) => set("institutionName", v)} placeholder="e.g. FAST University" required />
                  {errors.institutionName && <p style={{ color: "var(--red-arena)", fontSize: "0.78rem", marginTop: "-0.5rem" }}>{errors.institutionName}</p>}
                  <Field label="Campus Name / City" value={form.campusName} onChange={(v) => set("campusName", v)} placeholder="e.g. Islamabad Campus" required />
                  {errors.campusName && <p style={{ color: "var(--red-arena)", fontSize: "0.78rem", marginTop: "-0.5rem" }}>{errors.campusName}</p>}
                </div>
              )}
            </div>

            {/* Playing or observing */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                I am attending as <span style={{ color: "var(--red-arena)" }}>*</span>
              </label>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {(["observer", "competitor"] as const).map((r) => (
                  <label
                    key={r}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                      padding: "0.75rem", borderRadius: "10px", cursor: "pointer",
                      border: `1px solid ${form.role === r ? "var(--teal)" : "var(--border-glass)"}`,
                      background: form.role === r ? "rgba(0,194,168,0.1)" : "rgba(20,35,50,0.5)",
                      transition: "all 0.15s",
                    }}
                  >
                    <input type="radio" name="role" value={r} checked={form.role === r} onChange={() => set("role", r)} style={{ display: "none" }} />
                    <span style={{ fontSize: "1.1rem" }}>{r === "observer" ? "👁️" : "⚔️"}</span>
                    <span style={{ color: form.role === r ? "var(--teal)" : "var(--text-muted)", fontWeight: 600, textTransform: "capitalize", fontSize: "0.9rem" }}>
                      {r === "observer" ? "Observer / Spectator" : "Competitor / Player"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Age confirmation */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer", userSelect: "none" }}>
              <input
                type="checkbox"
                checked={form.ageConfirmed}
                onChange={(e) => set("ageConfirmed", e.target.checked)}
                style={{ width: 18, height: 18, accentColor: "var(--teal)", cursor: "pointer", marginTop: "2px", flexShrink: 0 }}
              />
              <span style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.5 }}>
                I confirm that I am <strong style={{ color: "var(--text-primary)" }}>16 years of age or older</strong> and that the information provided is accurate.
              </span>
            </label>
            {errors.ageConfirmed && <p style={{ color: "var(--red-arena)", fontSize: "0.78rem", marginTop: "-0.75rem" }}>{errors.ageConfirmed}</p>}
          </div>
        )}

        {/* ── STEP 2: Game & Team (competitors only) ───────────────────── */}
        {step === 2 && form.role === "competitor" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h2 className="display" style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Pick Your Game</h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.75rem" }}>
              {GAMES.map((g) => (
                <button
                  key={g.slug}
                  type="button"
                  onClick={() => handleGameChange(g.slug)}
                  style={{
                    background: form.gameSlug === g.slug ? "rgba(0,194,168,0.12)" : "rgba(20,35,50,0.6)",
                    border: `1px solid ${form.gameSlug === g.slug ? "var(--teal)" : "var(--border-glass)"}`,
                    borderRadius: "12px", padding: "1rem 0.75rem", cursor: "pointer",
                    textAlign: "center", transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: "1.8rem", marginBottom: "0.4rem" }}>{g.emoji}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "0.9rem", letterSpacing: "0.04em", textTransform: "uppercase", color: form.gameSlug === g.slug ? "var(--teal)" : "var(--text-primary)" }}>
                    {g.name}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-faint)", marginTop: "0.2rem" }}>{g.format}</div>
                  {g.participationFee > 0 && (
                    <div style={{ fontSize: "0.7rem", color: "var(--gold)", marginTop: "0.3rem", fontFamily: "var(--font-mono)" }}>
                      +PKR {g.participationFee.toLocaleString()}
                    </div>
                  )}
                </button>
              ))}
            </div>
            {errors.gameSlug && <p style={{ color: "var(--red-arena)", fontSize: "0.78rem" }}>{errors.gameSlug}</p>}

            {/* Team fields */}
            {selectedGame?.isTeam && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <Field label="Team Name" value={form.teamName} onChange={(v) => set("teamName", v)} placeholder="e.g. Phantom Squad" required />
                {errors.teamName && <p style={{ color: "var(--red-arena)", fontSize: "0.78rem", marginTop: "-0.75rem" }}>{errors.teamName}</p>}

                <div>
                  <p style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "1rem" }}>
                    Teammates ({form.teammates.length} — you are the captain)
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    {form.teammates.map((tm, i) => (
                      <div key={i} className="glass" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <p style={{ fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--teal)" }}>
                          Player {i + 2}
                        </p>
                        <Field label="Full Name" value={tm.fullName} onChange={(v) => updateTeammate(i, "fullName", v)} placeholder="Teammate name" required />
                        {errors[`tm_name_${i}`] && <p style={{ color: "var(--red-arena)", fontSize: "0.78rem", marginTop: "-0.5rem" }}>{errors[`tm_name_${i}`]}</p>}
                        <Field label="Email" value={tm.email} onChange={(v) => updateTeammate(i, "email", v)} type="email" placeholder="teammate@example.com" required />
                        {errors[`tm_email_${i}`] && <p style={{ color: "var(--red-arena)", fontSize: "0.78rem", marginTop: "-0.5rem" }}>{errors[`tm_email_${i}`]}</p>}
                        <Field label="Phone" value={tm.phone} onChange={(v) => updateTeammate(i, "phone", v)} type="tel" placeholder="03xx-xxxxxxx" required />
                        {errors[`tm_phone_${i}`] && <p style={{ color: "var(--red-arena)", fontSize: "0.78rem", marginTop: "-0.5rem" }}>{errors[`tm_phone_${i}`]}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Fee summary */}
            {selectedGame && (
              <div className="glass glass--gold" style={{ padding: "1.25rem 1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  <span>Registration / Access fee</span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>PKR 1,000</span>
                </div>
                {selectedGame.participationFee > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                    <span>{selectedGame.name} competition fee</span>
                    <span style={{ fontFamily: "var(--font-mono)" }}>PKR {selectedGame.participationFee.toLocaleString()}</span>
                  </div>
                )}
                {externalSurcharge > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                    <span>External squad surcharge</span>
                    <span style={{ fontFamily: "var(--font-mono)" }}>PKR {externalSurcharge.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ borderTop: "1px solid var(--border-gold)", paddingTop: "0.6rem", display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                  <span style={{ color: "var(--gold)" }}>Total per player</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--gold)" }}>
                    PKR {totalFee.toLocaleString()}
                  </span>
                </div>
                {selectedGame.isTeam && (
                  <p style={{ fontSize: "0.75rem", color: "var(--text-faint)", marginTop: "0.5rem" }}>
                    × {selectedGame.teamSize} players = PKR {(totalFee * selectedGame.teamSize).toLocaleString()} total for the team
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── PAYMENT STEP ─────────────────────────────────────────────── */}
        {step === paymentStep && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h2 className="display" style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Payment</h2>

            {/* Pass card — Citizen or Gladiator */}
            {form.role === "observer" ? (
              <div
                className="glass glass--teal"
                style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontSize: "2rem" }}>🏛️</span>
                  <div>
                    <p style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--teal)", marginBottom: "0.2rem" }}>
                      Your Pass
                    </p>
                    <h3 className="display" style={{ fontSize: "1.6rem", color: "var(--text-primary)" }}>
                      Citizen Pass
                    </h3>
                  </div>
                  <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "1.4rem", color: "var(--teal)", fontWeight: 700 }}>
                    PKR 1,000
                  </span>
                </div>
                <div style={{ borderTop: "1px solid var(--border-teal)", paddingTop: "0.75rem" }}>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.65 }}>
                    ✅ &nbsp;Access to all three zones: <strong style={{ color: "var(--text-primary)" }}>E-Sports Arena</strong> (spectate),{" "}
                    <strong style={{ color: "var(--text-primary)" }}>Casual Arena</strong>, and{" "}
                    <strong style={{ color: "var(--text-primary)" }}>Legacy Lounge</strong><br />
                    ❌ &nbsp;Cannot <em>compete</em> in the 5 prized titles (Valorant, PUBG, Free Fire, Tekken 8, EA FC 26)
                  </p>
                </div>
                <div
                  style={{
                    background: "rgba(0,194,168,0.07)",
                    border: "1px solid rgba(0,194,168,0.2)",
                    borderRadius: "8px",
                    padding: "0.75rem 1rem",
                    fontSize: "0.78rem",
                    color: "var(--text-faint)",
                    lineHeight: 1.6,
                  }}
                >
                  ℹ️ The Citizen Pass grants full 3-day venue access across all zones. All attendees — including MIUC and ROOTS students — are required to hold a valid pass.
                  Should you wish to compete at a later stage, you may upgrade to a Gladiator Pass by paying the difference for your chosen title.
                </div>
              </div>
            ) : (
              <div
                className="glass glass--gold"
                style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "2rem" }}>⚔️</span>
                  <div>
                    <p style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: "0.2rem" }}>
                      Your Pass
                    </p>
                    <h3 className="display" style={{ fontSize: "1.6rem", color: "var(--text-primary)" }}>
                      Gladiator Pass
                    </h3>
                  </div>
                  <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "1.4rem", color: "var(--gold)", fontWeight: 700 }}>
                    PKR {totalFee.toLocaleString()}
                  </span>
                </div>

                {/* Fee breakdown */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", paddingTop: "0.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    <span>Base / access fee</span>
                    <span style={{ fontFamily: "var(--font-mono)" }}>PKR 1,000</span>
                  </div>
                  {selectedGame && selectedGame.participationFee > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      <span>{selectedGame.name} competition fee</span>
                      <span style={{ fontFamily: "var(--font-mono)" }}>PKR {selectedGame.participationFee.toLocaleString()}</span>
                    </div>
                  )}
                  {externalSurcharge > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      <span>External squad surcharge</span>
                      <span style={{ fontFamily: "var(--font-mono)" }}>PKR {externalSurcharge.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ borderTop: "1px solid var(--border-gold)", paddingTop: "0.4rem", display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.9rem" }}>
                    <span style={{ color: "var(--gold)" }}>Total per player</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--gold)" }}>PKR {totalFee.toLocaleString()}</span>
                  </div>
                  {selectedGame?.isTeam && (
                    <p style={{ fontSize: "0.72rem", color: "var(--text-faint)", textAlign: "right" }}>
                      × {selectedGame.teamSize} players = PKR {((totalFee) * selectedGame.teamSize).toLocaleString()} total for the team
                    </p>
                  )}
                </div>

                <div style={{ borderTop: "1px solid var(--border-gold)", paddingTop: "0.75rem" }}>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.65 }}>
                    ✅ &nbsp;Everything in the Citizen Pass (full 3-zone access)<br />
                    ✅ &nbsp;Right to <strong style={{ color: "var(--text-primary)" }}>compete</strong> in{" "}
                    <strong style={{ color: "var(--gold)" }}>{selectedGame?.name ?? "your chosen title"}</strong> — bracket seeding, match check-in & prize eligibility<br />
                    ✅ &nbsp;Your own <strong style={{ color: "var(--text-primary)" }}>QR code</strong> for game-station check-in
                  </p>
                </div>

                <div
                  style={{
                    background: "rgba(245,200,66,0.06)",
                    border: "1px solid rgba(245,200,66,0.2)",
                    borderRadius: "8px",
                    padding: "0.75rem 1rem",
                    fontSize: "0.78rem",
                    color: "var(--text-faint)",
                    lineHeight: 1.6,
                  }}
                >
                  ℹ️ The Gladiator Pass includes the PKR 1,000 base access fee applicable to all attendees, plus the participation fee for your chosen title.
                  {selectedGame?.isTeam
                    ? " Each player on the roster must hold their own Gladiator Pass — fees are per player, not per team."
                    : " This is an individual pass — one per competing player."}
                  {" "}Passes are non-transferable. Entry is subject to payment verification.
                </div>
              </div>
            )}

            {/* Payment details */}
            <div className="glass" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--teal)" }}>
                How to Pay
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ background: "rgba(20,35,50,0.8)", borderRadius: "10px", padding: "1rem 1.25rem" }}>
                  <p style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: "0.35rem" }}>
                    Bank Transfer
                  </p>
                  <p style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)", fontSize: "1rem", letterSpacing: "0.05em" }}>
                    0000-0000-0000-0000
                  </p>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-faint)", marginTop: "0.25rem" }}>
                    Account Title: The Colosseum · Bank: TBD
                  </p>
                </div>
                <div style={{ textAlign: "center", color: "var(--text-faint)", fontSize: "0.8rem" }}>— or —</div>
                <div style={{ background: "rgba(20,35,50,0.8)", borderRadius: "10px", padding: "1rem 1.25rem" }}>
                  <p style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: "0.35rem" }}>
                    EasyPaisa
                  </p>
                  <p style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)", fontSize: "1.1rem", letterSpacing: "0.08em" }}>
                    03XX-XXXXXXX
                  </p>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-faint)", marginTop: "0.25rem" }}>
                    Account name: TBD
                  </p>
                </div>
              </div>
              <div style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "1rem" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.6 }}>
                  📌 <strong style={{ color: "var(--text-primary)" }}>Instructions:</strong> Send exactly{" "}
                  <strong style={{ color: "var(--gold)" }}>PKR {totalFee.toLocaleString()}</strong> to either account above.
                  Use your <strong style={{ color: "var(--text-primary)" }}>full name</strong> as the payment description.
                  Once your payment is confirmed by our team,{" "}
                  <strong style={{ color: "var(--teal)" }}>a QR code will be sent to your email for venue entry</strong>.
                </p>
              </div>
            </div>

            <Field
              label="Transaction Reference / EasyPaisa Number used"
              value={form.transactionRef}
              onChange={(v) => set("transactionRef", v)}
              placeholder="e.g. TXN123456789 or 03XX-XXXXXXX"
              required
            />
            {errors.transactionRef && <p style={{ color: "var(--red-arena)", fontSize: "0.78rem", marginTop: "-0.75rem" }}>{errors.transactionRef}</p>}

            {/* Payment screenshot (optional but speeds up verification) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                Payment Screenshot <span style={{ color: "var(--text-faint)", textTransform: "none", letterSpacing: 0 }}>(optional — speeds up verification)</span>
              </label>
              <label
                style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  background: "rgba(20,35,50,0.7)", border: `1px dashed ${screenshotFile ? "var(--teal)" : "var(--border-glass)"}`,
                  borderRadius: "10px", padding: "0.85rem 1rem", cursor: "pointer",
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    if (f && f.size > 8 * 1024 * 1024) { setSubmitError("Screenshot must be under 8 MB."); return; }
                    setSubmitError("");
                    setScreenshotFile(f);
                  }}
                />
                <span style={{ fontSize: "1.2rem" }}>{screenshotFile ? "🧾" : "📎"}</span>
                <span style={{ fontSize: "0.85rem", color: screenshotFile ? "var(--teal)" : "var(--text-muted)" }}>
                  {screenshotFile ? `${screenshotFile.name} (${(screenshotFile.size / 1024).toFixed(0)} KB)` : "Attach your transfer receipt / screenshot"}
                </span>
                {screenshotFile && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setScreenshotFile(null); }}
                    style={{ marginLeft: "auto", background: "transparent", border: "none", color: "var(--red-arena)", cursor: "pointer", fontSize: "0.8rem" }}
                  >
                    ✕ remove
                  </button>
                )}
              </label>
            </div>
          </div>
        )}

        {/* ── CONFIRM STEP ─────────────────────────────────────────────── */}
        {step === totalSteps && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h2 className="display" style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Confirm & Submit</h2>

            <div className="glass" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {[
                ["Name",        form.fullName],
                ["Email",       form.email],
                ["Phone",       form.phone],
                ["Institution", form.isInternal ? `${form.internalOrg.toUpperCase()} — ${form.campusName}` : `${form.institutionName} — ${form.campusName}`],
                ["Role",        form.role === "competitor" ? "Competitor / Player" : "Observer / Spectator"],
                ...(form.role === "competitor" && selectedGame ? [
                  ["Game",        `${selectedGame.emoji} ${selectedGame.name}`],
                  ...(selectedGame.isTeam ? [["Team", form.teamName]] : []),
                ] : []),
                ["Transaction Ref", form.transactionRef],
                ["Receipt", screenshotFile ? screenshotFile.name : "Not attached"],
                ["Amount",      `PKR ${totalFee.toLocaleString()}`],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", fontSize: "0.875rem", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-faint)", flexShrink: 0 }}>{label}</span>
                  <span style={{ color: "var(--text-primary)", textAlign: "right" }}>{value}</span>
                </div>
              ))}
            </div>

            {form.role === "competitor" && selectedGame?.isTeam && form.teammates.length > 0 && (
              <div className="glass" style={{ padding: "1.25rem" }}>
                <p style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--teal)", marginBottom: "0.75rem" }}>
                  Squad ({form.teammates.length + 1} players)
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>1. {form.fullName} <span style={{ color: "var(--gold)", fontSize: "0.72rem" }}>CAPTAIN</span></p>
                  {form.teammates.map((t, i) => (
                    <p key={i} style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{i + 2}. {t.fullName}</p>
                  ))}
                </div>
              </div>
            )}

            <p style={{ fontSize: "0.8rem", color: "var(--text-faint)", lineHeight: 1.6 }}>
              By submitting you confirm all details are correct. Your registration is pending payment verification. Entry QR codes are issued after payment is confirmed.
            </p>

            {submitError && (
              <p style={{ color: "var(--red-arena)", fontSize: "0.85rem", textAlign: "center" }}>
                {submitError}
              </p>
            )}
            <button
              type="button"
              className="btn-primary"
              style={{ fontSize: "1rem", padding: "0.9rem", justifyContent: "center", opacity: submitting ? 0.6 : 1 }}
              disabled={submitting}
              onClick={async () => {
                setSubmitting(true);
                setSubmitError("");
                try {
                  // Upload the receipt first (if attached) so the payment row
                  // can reference it.
                  let screenshotPath: string | undefined;
                  if (screenshotFile) {
                    const fd = new FormData();
                    fd.append("screenshot", screenshotFile);
                    const up = await uploadPaymentScreenshot(fd);
                    if (!up.success) {
                      setSubmitError(up.error ?? "Screenshot upload failed.");
                      setSubmitting(false);
                      return;
                    }
                    screenshotPath = up.path;
                  }

                  const gameId = form.role === "competitor" && form.gameSlug
                    ? await getGameIdBySlug(form.gameSlug)
                    : undefined;

                  const institutionType = form.isInternal
                    ? (form.internalOrg === "miuc" ? "miuc" : "roots")
                    : "external_college";

                  const result = await submitRegistration({
                    fullName: form.fullName,
                    email: form.email,
                    phone: form.phone,
                    institutionName: form.isInternal
                      ? `${form.internalOrg.toUpperCase()} — ${form.campusName}`
                      : `${form.institutionName} — ${form.campusName}`,
                    institutionType,
                    role: form.role,
                    gameSlug: form.gameSlug || undefined,
                    gameId: gameId ?? undefined,
                    teamName: form.teamName || undefined,
                    isTeamGame: selectedGame?.isTeam,
                    teammates: form.teammates,
                    totalFeePkr: totalFee,
                    transactionRef: form.transactionRef,
                    screenshotPath,
                  });

                  if (result.success) {
                    setSubmitted(true);
                  } else {
                    setSubmitError(result.error ?? "Submission failed. Please try again.");
                  }
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {submitting ? "Submitting…" : "⚔️ Submit Registration"}
            </button>
          </div>
        )}

        {/* ── Navigation buttons ────────────────────────────────────────── */}
        {step < totalSteps && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2rem", gap: "1rem" }}>
            {step > 1 ? (
              <button type="button" className="btn-ghost" onClick={back} style={{ fontSize: "0.9rem" }}>
                ← Back
              </button>
            ) : <div />}
            <button type="button" className="btn-primary" onClick={next} style={{ fontSize: "0.9rem" }}>
              {step === paymentStep ? "Review & Confirm →" : "Continue →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
