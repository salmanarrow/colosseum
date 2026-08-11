"use client";

import { useEffect, useState } from "react";

// Two-phase event: the countdown targets the pre-launch first, then rolls over
// to the main event once the pre-launch has finished.
const PRE_LAUNCH_START = new Date("2026-09-05T09:00:00+05:00");
const PRE_LAUNCH_END   = new Date("2026-09-06T23:59:59+05:00");
const MAIN_EVENT_START = new Date("2026-10-02T09:00:00+05:00");
const MAIN_EVENT_END   = new Date("2026-10-04T23:59:59+05:00");

function getPhase(now: Date) {
  if (now < PRE_LAUNCH_START) return { target: PRE_LAUNCH_START, label: "Until Pre-Launch" };
  if (now <= PRE_LAUNCH_END)  return { target: null, label: "Pre-Launch is live" };
  if (now < MAIN_EVENT_START) return { target: MAIN_EVENT_START, label: "Until Main Event" };
  if (now <= MAIN_EVENT_END)  return { target: null, label: "Main Event is live" };
  return { target: null, label: "See you next year" };
}

function getTimeLeft() {
  const now = new Date();
  const { target, label } = getPhase(now);
  if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0, label, live: true };
  const diff = target.getTime() - now.getTime();
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    label,
    live: false,
  };
}

function Digit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="glass--gold glass flex items-center justify-center"
        style={{
          width: "clamp(64px, 14vw, 108px)",
          height: "clamp(64px, 14vw, 108px)",
        }}
      >
        <span
          className="display text-gold-foil"
          style={{ fontSize: "clamp(2rem, 7vw, 4rem)" }}
        >
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span
        className="eyebrow"
        style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}
      >
        {label}
      </span>
    </div>
  );
}

export default function Countdown() {
  // Start from a fixed zero state so server and client markup match, then fill
  // in the live value after mount (avoids a hydration mismatch on the clock).
  const [t, setT] = useState<ReturnType<typeof getTimeLeft> | null>(null);

  useEffect(() => {
    setT(getTimeLeft());
    const id = setInterval(() => setT(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const v = t ?? { days: 0, hours: 0, minutes: 0, seconds: 0, label: "Until Pre-Launch", live: false };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <span className="eyebrow" style={{ color: v.live ? "var(--violet)" : "var(--text-muted)" }}>
        {v.label}
      </span>
      <div className="flex items-start gap-3 sm:gap-5">
      <Digit value={v.days} label="Days" />
      <span
        className="display text-gold-foil self-center"
        style={{ fontSize: "clamp(1.5rem, 5vw, 3rem)", marginBottom: "1.2rem" }}
      >
        :
      </span>
      <Digit value={v.hours} label="Hours" />
      <span
        className="display text-gold-foil self-center"
        style={{ fontSize: "clamp(1.5rem, 5vw, 3rem)", marginBottom: "1.2rem" }}
      >
        :
      </span>
      <Digit value={v.minutes} label="Mins" />
      <span
        className="display text-gold-foil self-center"
        style={{ fontSize: "clamp(1.5rem, 5vw, 3rem)", marginBottom: "1.2rem" }}
      >
        :
      </span>
      <Digit value={v.seconds} label="Secs" />
      </div>
    </div>
  );
}
