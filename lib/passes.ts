/**
 * The pass set — one definition of how every issued pass looks and what it
 * admits. Shared by the HTML email, the printable PDF and the gate scanner so
 * a marshal, an inbox and a printout never disagree.
 *
 * IMPORTANT: a pass is identified by (tier + event), never tier alone.
 * "Observer" means two completely different products: the PreLaunch Observer
 * admits to the Auto Show and DJ Night on 5 September, while the Colosseum
 * Observer admits to the concert and shows across 2–4 October. Keying on tier
 * alone previously printed Colosseum programming on PreLaunch passes.
 */

export type PassTier = "hackathon" | "game_entry" | "observer" | "cosplay" | "vehicle";
export type EventKey = "prelaunch" | "colosseum";

export const EVENT_META: Record<EventKey, { name: string; dates: string; dayCount: number }> = {
  prelaunch: { name: "PreLaunch",     dates: "5 September 2026",   dayCount: 1 },
  colosseum: { name: "The Colosseum", dates: "2 – 4 October 2026", dayCount: 3 },
};

export type PassStyle = {
  label: string;
  /** Accent colour — the one thing a marshal reads from three metres away. */
  accent: string;
  accentDeep: string;
  strapline: string;
  /** What the holder is admitted to, in plain words. Event-specific. */
  admits: string[];
  icon: string;
};

const ACCENT: Record<PassTier, { accent: string; deep: string; icon: string }> = {
  hackathon:  { accent: "#B026FF", deep: "#7A17B8", icon: "</>" },
  game_entry: { accent: "#00D1B2", deep: "#00806E", icon: "▶" },
  cosplay:    { accent: "#FF7AC8", deep: "#A82E77", icon: "★" },
  observer:   { accent: "#C8CDD9", deep: "#8B93A3", icon: "◈" },
  vehicle:    { accent: "#FFB020", deep: "#A86A00", icon: "⬢" },
};

/**
 * Resolve the pass for a given tier AND event. Anything listed here must be
 * true for that event — a PreLaunch pass must never mention the concert,
 * cosplay or "all three days", none of which happen on 5 September.
 */
export function getPassStyle(tier: PassTier, event: EventKey): PassStyle {
  const a = ACCENT[tier];
  const base = { accent: a.accent, accentDeep: a.deep, icon: a.icon };

  if (event === "prelaunch") {
    switch (tier) {
      case "hackathon":
        return {
          ...base,
          label: "Hackathon Pass",
          strapline: "Competitor · CTF + MVP",
          admits: [
            "Hackathon — competing",
            "Auto Show",
            "Robotic Exhibition",
            "DJ Night",
            "Fireworks",
          ],
        };
      case "vehicle":
        return {
          ...base,
          label: "Vehicle Gate Pass",
          strapline: "Auto Show · Exhibitor",
          admits: [
            "One vehicle — marshalled entry",
            "Auto Show paddock",
            "DJ Night",
            "Fireworks",
          ],
        };
      default:
        // PreLaunch Observer — Auto Show + DJ Night only, no hackathon entry.
        return {
          ...base,
          label: "PreLaunch Observer",
          strapline: "Spectator · 5 September",
          admits: [
            "Auto Show",
            "DJ Night",
            "Not competing in the Hackathon",
          ],
        };
    }
  }

  // ── The Colosseum, 2–4 October ──
  switch (tier) {
    case "game_entry":
      return {
        ...base,
        label: "Game Entry",
        strapline: "Competitor · E-Sports Arena",
        admits: [
          "Your title — competing",
          "E-Sports Arena",
          "All three days (2–4 Oct)",
        ],
      };
    case "cosplay":
      return {
        ...base,
        label: "Cosplay Entry",
        strapline: "Competitor · Cosplay Contest",
        admits: [
          "Cosplay contest — competing",
          "Arena floor",
          "All three days (2–4 Oct)",
        ],
      };
    case "hackathon":
      // Shouldn't occur — the hackathon is a PreLaunch track.
      return {
        ...base,
        label: "Hackathon Pass",
        strapline: "Competitor",
        admits: ["Hackathon — competing"],
      };
    case "vehicle":
      return {
        ...base,
        label: "Vehicle Gate Pass",
        strapline: "Exhibitor",
        admits: ["One vehicle — marshalled entry"],
      };
    default:
      return {
        ...base,
        label: "Colosseum Observer",
        strapline: "Spectator · Full Access",
        admits: [
          "Concert",
          "Cosplay · Gorilla Show · Jamming",
          "Arena floor — spectating",
          "All three days (2–4 Oct)",
        ],
      };
  }
}

/** Day strip. PreLaunch is Day 0 only; the Colosseum is Days 1–3. */
export function passDays(event: EventKey): { day: string; active: boolean }[] {
  const all: { day: string; event: EventKey }[] = [
    { day: "Day 0", event: "prelaunch" },
    { day: "Day 1", event: "colosseum" },
    { day: "Day 2", event: "colosseum" },
    { day: "Day 3", event: "colosseum" },
  ];
  return all.map((d) => ({ day: d.day, active: d.event === event }));
}

/**
 * Concert status. The concert is on Day 3 of the Colosseum only — a PreLaunch
 * pass must say nothing about it at all.
 */
export function concertLine(tier: PassTier, socials: boolean, event: EventKey): string | null {
  if (event === "prelaunch") return null;
  if (tier === "observer") return "Concert included";
  if (tier === "game_entry" || tier === "cosplay") {
    return socials
      ? "Concert included (Socials add-on)"
      : "Concert NOT included — add the Socials upgrade";
  }
  return null;
}

/** Back-compat for callers that only need the accent/icon by tier. */
export const PASS_STYLES: Record<PassTier, PassStyle> = {
  hackathon:  getPassStyle("hackathon", "prelaunch"),
  vehicle:    getPassStyle("vehicle", "prelaunch"),
  game_entry: getPassStyle("game_entry", "colosseum"),
  cosplay:    getPassStyle("cosplay", "colosseum"),
  observer:   getPassStyle("observer", "colosseum"),
};
