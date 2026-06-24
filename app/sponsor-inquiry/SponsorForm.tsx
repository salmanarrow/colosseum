"use client";

import { useState } from "react";
import { submitInquiry } from "./actions";

type FormState = {
  contactName: string;
  email: string;
  phone: string;
  organizationName: string;
  organizationType: "sponsor" | "college" | "university" | "other";
  inquiryType: "sponsorship" | "team_interest" | "partnership" | "other";
  message: string;
};

const INITIAL: FormState = {
  contactName: "", email: "", phone: "", organizationName: "",
  organizationType: "sponsor", inquiryType: "sponsorship", message: "",
};

function Field({ label, value, onChange, type = "text", placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <label style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>
        {label}{required && <span style={{ color: "var(--red-arena)", marginLeft: "0.25rem" }}>*</span>}
      </label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{
          background: "rgba(20,35,50,0.7)", border: "1px solid var(--border-glass)", borderRadius: "10px",
          padding: "0.75rem 1rem", color: "var(--text-primary)", fontSize: "0.95rem",
          outline: "none", width: "100%", fontFamily: "var(--font-body)", transition: "border-color 0.15s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--teal)")}
        onBlur={(e)  => (e.target.style.borderColor = "var(--border-glass)")}
      />
    </div>
  );
}

function Select({ label, value, onChange, options, required }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; required?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <label style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>
        {label}{required && <span style={{ color: "var(--red-arena)", marginLeft: "0.25rem" }}>*</span>}
      </label>
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
        style={{
          background: "rgba(20,35,50,0.7)", border: "1px solid var(--border-glass)", borderRadius: "10px",
          padding: "0.75rem 1rem", color: "var(--text-primary)", fontSize: "0.95rem",
          width: "100%", fontFamily: "var(--font-body)",
        }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export default function SponsorForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function validate() {
    const e: Record<string, string> = {};
    if (!form.contactName.trim()) e.contactName = "Required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email required";
    if (!form.organizationName.trim()) e.organizationName = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const result = await submitInquiry(form);
      if (result.success) setDone(true);
      else setSubmitError(result.error ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="glass glass--gold" style={{ padding: "3rem 2rem", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🤝</div>
        <h2 className="display" style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>Message Received</h2>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
          Thank you, <strong style={{ color: "var(--text-primary)" }}>{form.contactName}</strong>.<br />
          The committee will be in touch at <strong style={{ color: "var(--teal)" }}>{form.email}</strong> shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="glass" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <Field label="Your Name" value={form.contactName} onChange={(v) => set("contactName", v)} placeholder="Full name" required />
      {errors.contactName && <p style={{ color: "var(--red-arena)", fontSize: "0.78rem", marginTop: "-0.75rem" }}>{errors.contactName}</p>}

      <Field label="Email" value={form.email} onChange={(v) => set("email", v)} type="email" placeholder="you@organization.com" required />
      {errors.email && <p style={{ color: "var(--red-arena)", fontSize: "0.78rem", marginTop: "-0.75rem" }}>{errors.email}</p>}

      <Field label="Phone" value={form.phone} onChange={(v) => set("phone", v)} type="tel" placeholder="03xx-xxxxxxx" />

      <Field label="Organization / Institution Name" value={form.organizationName} onChange={(v) => set("organizationName", v)} placeholder="e.g. Coca-Cola Pakistan" required />
      {errors.organizationName && <p style={{ color: "var(--red-arena)", fontSize: "0.78rem", marginTop: "-0.75rem" }}>{errors.organizationName}</p>}

      <Select
        label="Organization Type" value={form.organizationType}
        onChange={(v) => set("organizationType", v as FormState["organizationType"])}
        options={[
          { value: "sponsor",    label: "Brand / Sponsor" },
          { value: "college",    label: "College" },
          { value: "university", label: "University" },
          { value: "other",      label: "Other" },
        ]}
        required
      />

      <Select
        label="Inquiry Type" value={form.inquiryType}
        onChange={(v) => set("inquiryType", v as FormState["inquiryType"])}
        options={[
          { value: "sponsorship",   label: "Sponsorship / Brand Partnership" },
          { value: "partnership",   label: "Media / Coverage Partnership" },
          { value: "team_interest", label: "Bringing a Team / Institution Tie-up" },
          { value: "other",         label: "Other" },
        ]}
        required
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <label style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          Message
        </label>
        <textarea
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder="Tell us what you have in mind…"
          rows={4}
          style={{
            background: "rgba(20,35,50,0.7)", border: "1px solid var(--border-glass)", borderRadius: "10px",
            padding: "0.75rem 1rem", color: "var(--text-primary)", fontSize: "0.95rem",
            outline: "none", width: "100%", fontFamily: "var(--font-body)", resize: "vertical",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--teal)")}
          onBlur={(e)  => (e.target.style.borderColor = "var(--border-glass)")}
        />
      </div>

      {submitError && <p style={{ color: "var(--red-arena)", fontSize: "0.85rem", textAlign: "center" }}>{submitError}</p>}

      <button
        type="button"
        className="btn-primary"
        style={{ fontSize: "1rem", padding: "0.9rem", justifyContent: "center", opacity: submitting ? 0.6 : 1 }}
        disabled={submitting}
        onClick={handleSubmit}
      >
        {submitting ? "Sending…" : "Send Inquiry →"}
      </button>
    </div>
  );
}
