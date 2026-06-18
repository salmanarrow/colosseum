"use client";

import { useEffect, useState } from "react";

const EVENT_DATE = new Date("2026-08-01T09:00:00+05:00");

function getTimeLeft() {
  const now = new Date();
  const diff = EVENT_DATE.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
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
  const [t, setT] = useState(getTimeLeft());

  useEffect(() => {
    const id = setInterval(() => setT(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-start gap-3 sm:gap-5">
      <Digit value={t.days} label="Days" />
      <span
        className="display text-gold-foil self-center"
        style={{ fontSize: "clamp(1.5rem, 5vw, 3rem)", marginBottom: "1.2rem" }}
      >
        :
      </span>
      <Digit value={t.hours} label="Hours" />
      <span
        className="display text-gold-foil self-center"
        style={{ fontSize: "clamp(1.5rem, 5vw, 3rem)", marginBottom: "1.2rem" }}
      >
        :
      </span>
      <Digit value={t.minutes} label="Mins" />
      <span
        className="display text-gold-foil self-center"
        style={{ fontSize: "clamp(1.5rem, 5vw, 3rem)", marginBottom: "1.2rem" }}
      >
        :
      </span>
      <Digit value={t.seconds} label="Secs" />
    </div>
  );
}
