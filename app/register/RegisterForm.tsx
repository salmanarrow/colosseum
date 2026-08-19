"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import { submitRegistration, uploadPaymentScreenshot } from "./actions";
import { compressImage } from "@/lib/compressImage";

// ── Types ──────────────────────────────────────────────────────────────────

export type Product = {
  id: string;
  slug: string;
  name: string;
  format: string | null;
  event: "prelaunch" | "colosseum";
  category: string;
  isTeamEvent: boolean;
  minPlayers: number;
  maxPlayers: number;
  pricePkr: number;
  priceBasis: "per_team" | "per_person";
  socialsAddonPkr: number;
  isFreeActivity: boolean;
  displayOrder: number;
};

type Teammate = { fullName: string; email: string; phone: string };

const EMPTY_TEAMMATE: Teammate = { fullName: "", email: "", phone: "" };

const EVENTS = [
  {
    key: "prelaunch" as const,
    name: "PreLaunch",
    date: "5 September 2026",
    blurb: "Auto Show · Hackathon · Robotic Exhibition · DJ Tokyo · Fireworks",
    emoji: "🎆",
  },
  {
    key: "colosseum" as const,
    name: "The Colosseum",
    date: "2 – 4 October 2026",
    blurb: "Three days of gaming · Cosplay · Comedy · Jamming · Concert",
    emoji: "🏛️",
  },
];

// Institution is captured for records only — it no longer affects pricing.
const MIUC_CAMPUSES = [
  "Islamabad (H-8/4)", "Columbia Park, Islamabad", "Richmond, Islamabad (DHA-2)",
  "Wah Cantt", "Peshawar", "Askari, Lahore", "Abbottabad", "Sialkot",
];
const RIS_CAMPUSES = [
  "Wellington, Islamabad", "Liverpool, Islamabad", "Winchester, Islamabad",
  "Repton, Islamabad", "Richmond, Islamabad", "Columbia Park, Islamabad",
  "New PWD, Islamabad", "Claremont, Rawalpindi", "Rawal, Rawalpindi",
  "Gulzar-e-Quaid, Rawalpindi", "Gandhara, Wah Cantt", "Oakdale, Wah Cantt",
  "Monash, Abbottabad", "Zamrud, Peshawar", "Riverview, Muzaffarabad (AJK)",
  "Phoenix, Chakwal", "Palm Tree, Sialkot", "Askari, Lahore",
  "Sevenoaks, Lahore", "Kingswood, Karachi", "Hamilton, Karachi", "Gujranwala",
];

type FormState = {
  event: "" | "prelaunch" | "colosseum";
  productId: string;
  fullName: string;
  email: string;
  phone: string;
  isInternal: boolean;
  internalOrg: "" | "miuc" | "roots";
  institutionName: string;
  campusName: string;
  teamName: string;
  teammates: Teammate[];
  wantsSocials: boolean;
  ageConfirmed: boolean;
  transactionRef: string;
};

const INITIAL: FormState = {
  event: "", productId: "",
  fullName: "", email: "", phone: "",
  isInternal: false, internalOrg: "", institutionName: "", campusName: "",
  teamName: "", teammates: [], wantsSocials: false,
  ageConfirmed: false, transactionRef: "",
};

// ── Small UI helpers ───────────────────────────────────────────────────────

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
        type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "rgba(22,18,32,0.7)", border: "1px solid var(--border-glass)",
          borderRadius: "10px", padding: "0.75rem 1rem", color: "var(--text-primary)",
          fontSize: "0.95rem", outline: "none", width: "100%", fontFamily: "var(--font-body)",
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--violet)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--border-glass)")}
      />
    </div>
  );
}

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p style={{ color: "var(--red-arena)", fontSize: "0.78rem", marginTop: "-0.5rem" }}>{msg}</p>;
}

function StepDots({ step, total, labels }: { step: number; total: number; labels: string[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2.5rem" }}>
      {labels.slice(0, total).map((label, i) => {
        const n = i + 1, done = step > n, active = step === n;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: done ? "var(--violet)" : active ? "rgba(176,38,255,0.15)" : "rgba(22,18,32,0.8)",
                border: `2px solid ${done || active ? "var(--violet)" : "var(--border-glass)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.8rem", fontWeight: 700,
                color: done ? "#fff" : active ? "var(--violet)" : "var(--text-faint)",
              }}>{done ? "✓" : n}</div>
              <span style={{ fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: active ? "var(--violet)" : "var(--text-faint)" }}>
                {label}
              </span>
            </div>
            {i < total - 1 && (
              <div style={{ width: "2.5rem", height: 1, background: step > n ? "var(--violet)" : "var(--border-glass)", margin: "0 0.25rem 1.2rem" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function RegisterForm({ products }: { products: Product[] }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [receiptIssue, setReceiptIssue] = useState("");

  const set = (k: keyof FormState, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const product = products.find((p) => p.id === form.productId);
  const eventProducts = products.filter((p) => p.event === form.event);

  // Roster size drives both team fields and the per-person socials maths.
  const rosterSize = product?.isTeamEvent ? product.minPlayers : 1;
  const socialsTotal = form.wantsSocials && product ? product.socialsAddonPkr * rosterSize : 0;
  const total = (product?.pricePkr ?? 0) + socialsTotal;

  const LABELS = ["Ticket", "Details", "Payment", "Confirm"];
  const TOTAL_STEPS = 4;

  // ── Validation ──────────────────────────────────────────────────────────
  function validate(s: number) {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!form.event) e.event = "Choose an event";
      else if (!form.productId) e.productId = "Choose a ticket";
    }
    if (s === 2) {
      if (!form.fullName.trim()) e.fullName = "Required";
      if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
      if (!form.phone.trim()) e.phone = "Required";
      if (form.isInternal && !form.internalOrg) e.internalOrg = "Select MIUC or ROOTS";
      if (form.isInternal && !form.campusName) e.campusName = "Select your campus";
      if (!form.isInternal && !form.institutionName.trim()) e.institutionName = "Required";
      if (!form.isInternal && !form.campusName.trim()) e.campusName = "Required";
      if (!form.ageConfirmed) e.ageConfirmed = "You must confirm your age";
      if (product?.isTeamEvent) {
        if (!form.teamName.trim()) e.teamName = "Required";
        form.teammates.forEach((t, i) => {
          if (!t.fullName.trim()) e[`tm_name_${i}`] = "Required";
          if (!/\S+@\S+\.\S+/.test(t.email)) e[`tm_email_${i}`] = "Valid email required";
          if (!t.phone.trim()) e[`tm_phone_${i}`] = "Required";
        });
      }
    }
    if (s === 3 && !form.transactionRef.trim()) {
      e.transactionRef = "Enter your transaction reference or the number you paid from";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() { if (validate(step)) setStep((s) => s + 1); }
  function back() { setErrors({}); setStep((s) => s - 1); }

  function pickProduct(p: Product) {
    set("productId", p.id);
    set("teamName", "");
    set("wantsSocials", false);
    // captain is the registrant, so collect (minPlayers - 1) teammates
    set("teammates", p.isTeamEvent ? Array.from({ length: Math.max(0, p.minPlayers - 1) }, () => ({ ...EMPTY_TEAMMATE })) : []);
  }

  function updateTeammate(i: number, k: keyof Teammate, v: string) {
    setForm((f) => {
      const t = [...f.teammates];
      t[i] = { ...t[i], [k]: v };
      return { ...f, teammates: t };
    });
  }

  const institutionLabel = form.isInternal
    ? `${form.internalOrg.toUpperCase()} — ${form.campusName}`
    : `${form.institutionName} — ${form.campusName}`;

  // ── Success ─────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="glass glass--gold" style={{ padding: "3rem 2rem", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>◈</div>
        <h2 className="display" style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>You&apos;re Registered</h2>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
          Your registration is <strong style={{ color: "var(--silver)" }}>pending payment confirmation</strong>.<br />
          Once the team verifies your payment, your QR entry pass is emailed to you.
        </p>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-faint)" }}>
          Watch <strong style={{ color: "var(--violet)" }}>{form.email}</strong> for your pass.
        </p>
        {receiptIssue && (
          <div style={{ marginTop: "1.5rem", background: "rgba(255,45,98,0.10)", border: "1px solid rgba(255,45,98,0.35)", borderRadius: 12, padding: "1rem 1.25rem", textAlign: "left" }}>
            <p style={{ color: "var(--red-arena)", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.35rem" }}>
              ⚠ Your receipt didn&apos;t upload
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", lineHeight: 1.6 }}>
              Your registration is saved — only the screenshot failed. Please email it to{" "}
              <strong style={{ color: "var(--silver)" }}>rootscolosseum@gmail.com</strong> quoting
              your transaction reference so we can verify your payment.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <Nav />
      <StepDots step={step} total={TOTAL_STEPS} labels={LABELS} />

      <div className="glass" style={{ padding: "2rem" }}>

        {/* ── STEP 1 · Event + ticket ─────────────────────────────────── */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h2 className="display" style={{ fontSize: "1.8rem" }}>Choose Your Event</h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
              {EVENTS.map((ev) => {
                const on = form.event === ev.key;
                return (
                  <button
                    key={ev.key} type="button"
                    onClick={() => { set("event", ev.key); set("productId", ""); }}
                    style={{
                      textAlign: "left", cursor: "pointer", padding: "1.1rem",
                      borderRadius: "14px",
                      border: `1px solid ${on ? "var(--violet)" : "var(--border-glass)"}`,
                      background: on ? "rgba(176,38,255,0.12)" : "rgba(22,18,32,0.6)",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ fontSize: "1.6rem", marginBottom: "0.4rem" }}>{ev.emoji}</div>
                    <div className="display" style={{ fontSize: "1.15rem", color: on ? "var(--violet)" : "var(--text-primary)" }}>
                      {ev.name}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--silver)", marginTop: "0.2rem", fontFamily: "var(--font-mono)" }}>
                      {ev.date}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "0.5rem", lineHeight: 1.5 }}>
                      {ev.blurb}
                    </div>
                  </button>
                );
              })}
            </div>
            <Err msg={errors.event} />

            {form.event && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <h3 className="eyebrow" style={{ marginTop: "0.5rem" }}>Select Your Ticket</h3>
                {eventProducts.map((p) => {
                  const on = form.productId === p.id;
                  return (
                    <button
                      key={p.id} type="button" onClick={() => pickProduct(p)}
                      style={{
                        display: "flex", alignItems: "center", gap: "1rem", textAlign: "left",
                        cursor: "pointer", padding: "0.9rem 1.1rem", borderRadius: "12px",
                        border: `1px solid ${on ? "var(--violet)" : "var(--border-glass)"}`,
                        background: on ? "rgba(176,38,255,0.1)" : "rgba(22,18,32,0.55)",
                        transition: "all 0.15s",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "var(--font-display)", letterSpacing: "0.04em", textTransform: "uppercase", fontSize: "1rem", color: on ? "var(--violet)" : "var(--text-primary)" }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                          {p.format}
                          {p.isTeamEvent && ` · up to ${p.maxPlayers} members`}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "var(--font-mono)", color: "var(--silver)", fontWeight: 700 }}>
                          PKR {p.pricePkr.toLocaleString()}
                        </div>
                        <div style={{ fontSize: "0.66rem", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                          {p.priceBasis === "per_team" ? "per team" : "per person"}
                        </div>
                      </div>
                    </button>
                  );
                })}
                <Err msg={errors.productId} />
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2 · Details ────────────────────────────────────────── */}
        {step === 2 && product && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h2 className="display" style={{ fontSize: "1.8rem" }}>
              {product.isTeamEvent ? "Captain & Roster" : "Your Details"}
            </h2>

            <Field label="Full Name" value={form.fullName} onChange={(v) => set("fullName", v)} placeholder="Full name" required />
            <Err msg={errors.fullName} />
            <Field label="Email Address" value={form.email} onChange={(v) => set("email", v)} type="email" placeholder="you@example.com" required />
            <Err msg={errors.email} />
            <Field label="Phone Number" value={form.phone} onChange={(v) => set("phone", v)} type="tel" placeholder="03xx-xxxxxxx" required />
            <Err msg={errors.phone} />

            {/* Institution — recorded, does not affect price */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <label style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                Institution <span style={{ color: "var(--red-arena)" }}>*</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }}>
                <input
                  type="checkbox" checked={form.isInternal}
                  onChange={(e) => { set("isInternal", e.target.checked); set("internalOrg", ""); set("institutionName", ""); set("campusName", ""); }}
                  style={{ width: 18, height: 18, accentColor: "var(--violet)", cursor: "pointer" }}
                />
                <span style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>
                  I study at <strong style={{ color: "var(--violet)" }}>MIUC or ROOTS</strong> (any campus)
                </span>
              </label>

              {form.isInternal ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    {(["miuc", "roots"] as const).map((org) => (
                      <button
                        key={org} type="button"
                        onClick={() => { set("internalOrg", org); set("campusName", ""); }}
                        style={{
                          flex: 1, padding: "0.7rem", borderRadius: "10px", cursor: "pointer",
                          border: `1px solid ${form.internalOrg === org ? "var(--violet)" : "var(--border-glass)"}`,
                          background: form.internalOrg === org ? "rgba(176,38,255,0.1)" : "rgba(22,18,32,0.5)",
                          color: form.internalOrg === org ? "var(--violet)" : "var(--text-muted)",
                          fontWeight: 700, letterSpacing: "0.05em", fontSize: "0.9rem",
                        }}
                      >{org.toUpperCase()}</button>
                    ))}
                  </div>
                  <Err msg={errors.internalOrg} />
                  {form.internalOrg && (
                    <select
                      value={form.campusName} onChange={(e) => set("campusName", e.target.value)}
                      style={{
                        background: "rgba(22,18,32,0.7)", border: "1px solid var(--border-glass)",
                        borderRadius: "10px", padding: "0.75rem 1rem",
                        color: form.campusName ? "var(--text-primary)" : "var(--text-faint)",
                        fontSize: "0.95rem", width: "100%",
                      }}
                    >
                      <option value="">Select your campus</option>
                      {(form.internalOrg === "miuc" ? MIUC_CAMPUSES : RIS_CAMPUSES).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  )}
                  <Err msg={errors.campusName} />
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <Field label="Institution Name" value={form.institutionName} onChange={(v) => set("institutionName", v)} placeholder="Institution Name" required />
                  <Err msg={errors.institutionName} />
                  <Field label="Campus / City" value={form.campusName} onChange={(v) => set("campusName", v)} placeholder="Campus or city" required />
                  <Err msg={errors.campusName} />
                </div>
              )}
            </div>

            {/* Team roster */}
            {product.isTeamEvent && (
              <>
                <Field label="Team Name" value={form.teamName} onChange={(v) => set("teamName", v)} placeholder="Your squad name" required />
                <Err msg={errors.teamName} />
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <p className="eyebrow">Teammates ({form.teammates.length} needed)</p>
                  {form.teammates.map((tm, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.6rem", padding: "1rem", borderRadius: "12px", background: "rgba(22,18,32,0.5)", border: "1px solid var(--border-glass)" }}>
                      <p style={{ fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--violet)" }}>
                        Member {i + 2}
                      </p>
                      <Field label="Full Name" value={tm.fullName} onChange={(v) => updateTeammate(i, "fullName", v)} placeholder="Full name" required />
                      <Err msg={errors[`tm_name_${i}`]} />
                      <Field label="Email" value={tm.email} onChange={(v) => updateTeammate(i, "email", v)} type="email" placeholder="teammate@example.com" required />
                      <Err msg={errors[`tm_email_${i}`]} />
                      <Field label="Phone" value={tm.phone} onChange={(v) => updateTeammate(i, "phone", v)} type="tel" placeholder="03xx-xxxxxxx" required />
                      <Err msg={errors[`tm_phone_${i}`]} />
                    </div>
                  ))}
                </div>
              </>
            )}

            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer" }}>
              <input
                type="checkbox" checked={form.ageConfirmed}
                onChange={(e) => set("ageConfirmed", e.target.checked)}
                style={{ width: 18, height: 18, accentColor: "var(--violet)", cursor: "pointer", marginTop: 2, flexShrink: 0 }}
              />
              <span style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.5 }}>
                I confirm I am <strong style={{ color: "var(--text-primary)" }}>16 years or older</strong> and the details above are accurate.
              </span>
            </label>
            <Err msg={errors.ageConfirmed} />
          </div>
        )}

        {/* ── STEP 3 · Add-on + payment ───────────────────────────────── */}
        {step === 3 && product && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h2 className="display" style={{ fontSize: "1.8rem" }}>Payment</h2>

            {/* Concert add-on */}
            {product.socialsAddonPkr > 0 && (
              <div className="glass glass--gold" style={{ padding: "1.25rem 1.5rem" }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer" }}>
                  <input
                    type="checkbox" checked={form.wantsSocials}
                    onChange={(e) => set("wantsSocials", e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: "var(--violet)", cursor: "pointer", marginTop: 3, flexShrink: 0 }}
                  />
                  <div>
                    <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.95rem" }}>
                      🎤 Add Concert Access — PKR {product.socialsAddonPkr.toLocaleString()} per person
                    </p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", lineHeight: 1.6, marginTop: "0.35rem" }}>
                      Your Game Entry covers competing in your title. Add this to also get
                      into the closing concert{rosterSize > 1 ? ` — charged for all ${rosterSize} squad members (PKR ${(product.socialsAddonPkr * rosterSize).toLocaleString()})` : ""}.
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Totals */}
            <div className="glass" style={{ padding: "1.25rem 1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                <span>{product.name} ({product.priceBasis === "per_team" ? "per team" : "per person"})</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>PKR {product.pricePkr.toLocaleString()}</span>
              </div>
              {socialsTotal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                  <span>Concert access × {rosterSize}</span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>PKR {socialsTotal.toLocaleString()}</span>
                </div>
              )}
              <div style={{ borderTop: "1px solid var(--border-gold)", paddingTop: "0.6rem", marginTop: "0.4rem", display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                <span style={{ color: "var(--silver)" }}>Total to pay</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--silver)", fontSize: "1.15rem" }}>
                  PKR {total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment instructions */}
            <div className="glass" style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <p className="eyebrow">Pay Via</p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Bank Account</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-faint)" }}>[to be added]</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                <span style={{ color: "var(--text-muted)" }}>EasyPaisa</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-faint)" }}>[to be added]</span>
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6, marginTop: "0.25rem" }}>
                📌 Send exactly <strong style={{ color: "var(--silver)" }}>PKR {total.toLocaleString()}</strong> and
                use your <strong style={{ color: "var(--text-primary)" }}>full name</strong> as the reference.
                Once confirmed, <strong style={{ color: "var(--violet)" }}>your QR pass is emailed to you</strong>.
              </p>
            </div>

            <Field
              label="Transaction Reference / Number Paid From"
              value={form.transactionRef} onChange={(v) => set("transactionRef", v)}
              placeholder="e.g. TXN123456789 or 03xx-xxxxxxx" required
            />
            <Err msg={errors.transactionRef} />

            {/* Receipt */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                Payment Screenshot <span style={{ color: "var(--text-faint)", textTransform: "none", letterSpacing: 0 }}>(optional — speeds up verification)</span>
              </label>
              <label style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                background: "rgba(22,18,32,0.7)",
                border: `1px dashed ${screenshotFile ? "var(--violet)" : "var(--border-glass)"}`,
                borderRadius: "10px", padding: "0.85rem 1rem", cursor: "pointer",
              }}>
                <input
                  type="file" accept="image/*" style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    if (f && f.size > 8 * 1024 * 1024) { setSubmitError("Screenshot must be under 8 MB."); return; }
                    setSubmitError(""); setScreenshotFile(f);
                  }}
                />
                <span style={{ fontSize: "1.2rem" }}>{screenshotFile ? "🧾" : "📎"}</span>
                <span style={{ fontSize: "0.85rem", color: screenshotFile ? "var(--violet)" : "var(--text-muted)" }}>
                  {screenshotFile ? `${screenshotFile.name} (${(screenshotFile.size / 1024).toFixed(0)} KB)` : "Attach your transfer receipt"}
                </span>
              </label>
            </div>
          </div>
        )}

        {/* ── STEP 4 · Confirm ────────────────────────────────────────── */}
        {step === 4 && product && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h2 className="display" style={{ fontSize: "1.8rem" }}>Confirm &amp; Submit</h2>

            <div className="glass" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {([
                ["Event", form.event === "prelaunch" ? "PreLaunch · 5 Sept 2026" : "The Colosseum · 2–4 Oct 2026"],
                ["Ticket", product.name],
                ["Name", form.fullName],
                ["Email", form.email],
                ["Phone", form.phone],
                ["Institution", institutionLabel],
                ...(product.isTeamEvent ? [["Team", form.teamName] as [string, string], ["Roster", `${rosterSize} members`] as [string, string]] : []),
                ["Concert access", form.wantsSocials ? `Yes (×${rosterSize})` : "No"],
                ["Transaction Ref", form.transactionRef],
                ["Receipt", screenshotFile ? screenshotFile.name : "Not attached"],
                ["Amount", `PKR ${total.toLocaleString()}`],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.45rem" }}>
                  <span style={{ fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-faint)" }}>{k}</span>
                  <span style={{ fontSize: "0.88rem", color: k === "Amount" ? "var(--silver)" : "var(--text-primary)", textAlign: "right", fontWeight: k === "Amount" ? 700 : 400 }}>{v}</span>
                </div>
              ))}
            </div>

            <p style={{ fontSize: "0.8rem", color: "var(--text-faint)", lineHeight: 1.6 }}>
              By submitting you confirm these details are correct. Your registration stays
              pending until payment is verified. QR passes are issued after confirmation.
            </p>

            {submitError && <p style={{ color: "var(--red-arena)", fontSize: "0.85rem", textAlign: "center" }}>{submitError}</p>}

            <button
              type="button" className="btn-primary" disabled={submitting}
              style={{ fontSize: "1rem", padding: "0.9rem", justifyContent: "center", opacity: submitting ? 0.6 : 1 }}
              onClick={async () => {
                setSubmitting(true); setSubmitError("");
                try {
                  // The receipt is OPTIONAL — a failed upload must never abort
                  // the registration. Losing someone's whole entry over an
                  // attachment is far worse than a missing screenshot.
                  let screenshotPath: string | undefined;
                  let receiptWarning = "";
                  if (screenshotFile) {
                    try {
                      const slim = await compressImage(screenshotFile);
                      const fd = new FormData();
                      fd.append("screenshot", slim);
                      const up = await uploadPaymentScreenshot(fd);
                      if (up.success) screenshotPath = up.path;
                      else receiptWarning = up.error ?? "Receipt could not be uploaded.";
                    } catch {
                      receiptWarning = "Receipt could not be uploaded.";
                    }
                  }
                  const res = await submitRegistration({
                    productId: product.id,
                    event: product.event,
                    fullName: form.fullName,
                    email: form.email,
                    phone: form.phone,
                    institutionName: institutionLabel,
                    institutionType: form.isInternal
                      ? (form.internalOrg === "miuc" ? "miuc" : "roots")
                      : "external_college",
                    teamName: form.teamName || undefined,
                    teammates: form.teammates,
                    wantsSocials: form.wantsSocials,
                    socialsCount: form.wantsSocials ? rosterSize : 0,
                    totalPkr: total,
                    transactionRef: form.transactionRef,
                    screenshotPath,
                  });
                  if (res.success) { setReceiptIssue(receiptWarning); setSubmitted(true); }
                  else setSubmitError(res.error ?? "Submission failed. Please try again.");
                } finally { setSubmitting(false); }
              }}
            >
              {submitting ? "Submitting…" : "◈ Submit Registration"}
            </button>
          </div>
        )}

        {/* ── Nav buttons ─────────────────────────────────────────────── */}
        {step < TOTAL_STEPS && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2rem", gap: "1rem" }}>
            {step > 1 ? (
              <button type="button" className="btn-ghost" onClick={back} style={{ fontSize: "0.9rem" }}>← Back</button>
            ) : <div />}
            <button type="button" className="btn-primary" onClick={next} style={{ fontSize: "0.9rem" }}>
              {step === 3 ? "Review & Confirm →" : "Continue →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
