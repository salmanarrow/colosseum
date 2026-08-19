/**
 * The pass set — one definition of how every issued pass looks and what it
 * admits. Shared by the HTML email, the printable PDF and the gate scanner so
 * a marshal, an inbox and a printout never disagree.
 */

export type PassTier = "hackathon" | "game_entry" | "observer" | "cosplay" | "vehicle";
export type EventKey = "prelaunch" | "colosseum";

export const EVENT_META: Record<EventKey, { name: string; dates: string; days: string[] }> = {
  prelaunch: { name: "PreLaunch",     dates: "5 September 2026",   days: ["Day 0"] },
  colosseum: { name: "The Colosseum", dates: "2 – 4 October 2026", days: ["Day 1", "Day 2", "Day 3"] },
};

export type PassStyle = {
  label: string;
  /** Accent colour — the one thing a marshal reads from three metres away. */
  accent: string;
  accentDeep: string;
  /** Short line under the pass name. */
  strapline: string;
  /** What the holder is admitted to, in plain words. */
  admits: string[];
  icon: string;
};

export const PASS_STYLES: Record<PassTier, PassStyle> = {
  hackathon: {
    label: "Hackathon Pass",
    accent: "#B026FF", accentDeep: "#7A17B8",
    strapline: "Competitor · CTF + MVP",
    admits: ["Hackathon (competing)", "Auto Show", "Robotic Exhibition", "DJ Night", "Fireworks"],
    icon: "</>",
  },
  game_entry: {
    label: "Game Entry",
    accent: "#00D1B2", accentDeep: "#00806E",
    strapline: "Competitor · E-Sports Arena",
    admits: ["Your title (competing)", "E-Sports Arena", "All three days"],
    icon: "▶",
  },
  cosplay: {
    label: "Cosplay Entry",
    accent: "#FF7AC8", accentDeep: "#A82E77",
    strapline: "Competitor · Cosplay Contest",
    admits: ["Cosplay contest (competing)", "Arena floor", "All three days"],
    icon: "★",
  },
  observer: {
    label: "Observer Pass",
    accent: "#C8CDD9", accentDeep: "#8B93A3",
    strapline: "Spectator · Full Access",
    admits: ["Concert", "Cosplay · Gorilla Show · Jamming", "Arena floor (spectating)", "All three days"],
    icon: "◈",
  },
  vehicle: {
    label: "Vehicle Gate Pass",
    accent: "#FFB020", accentDeep: "#A86A00",
    strapline: "Auto Show · Exhibitor",
    admits: ["One vehicle, marshalled entry", "Auto Show paddock", "DJ Night", "Fireworks"],
    icon: "⬢",
  },
};

/** Days a pass is valid for, marked on the day strip. */
export function passDays(event: EventKey): { day: string; active: boolean }[] {
  const all = [
    { day: "Day 0", event: "prelaunch" as EventKey },
    { day: "Day 1", event: "colosseum" as EventKey },
    { day: "Day 2", event: "colosseum" as EventKey },
    { day: "Day 3", event: "colosseum" as EventKey },
  ];
  return all.map((d) => ({ day: d.day, active: d.event === event }));
}

/** Human line for the concert add-on. */
export function concertLine(tier: PassTier, socials: boolean): string | null {
  if (tier === "observer") return "Concert included";
  if (tier === "game_entry" || tier === "cosplay") {
    return socials ? "Concert included (Socials add-on)" : "Concert NOT included — upgrade at the desk";
  }
  return null;
}
