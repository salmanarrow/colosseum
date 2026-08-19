/**
 * Printable PDF pass. Server-only — renders to a Buffer we can attach to the
 * ticket email or stream from the admin dashboard.
 *
 * Layout is deliberately print-first: high contrast, the QR large enough to
 * scan off paper or a phone screen, and the tier accent as a full-bleed band
 * so a marshal can sort a stack of passes by colour alone.
 */
import React from "react";
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { PASS_STYLES, EVENT_META, passDays, concertLine, type PassTier, type EventKey } from "./passes";
import { generateQRDataURL } from "./qr";

export type PassData = {
  tier: PassTier;
  event: EventKey;
  holderName: string;
  ticketNumber: string;
  qrToken: string;
  institution?: string;
  gameName?: string;
  teamName?: string;
  socials?: boolean;
  /** Vehicle passes only */
  vehicle?: string;
  plate?: string;
};

const BG = "#0B0912";
const CARD = "#141020";
const TEXT = "#F4F2F8";
const MUTED = "#A9AFC0";
const FAINT = "#6C7385";

const s = StyleSheet.create({
  page: { backgroundColor: BG, padding: 28, fontFamily: "Helvetica", color: TEXT },
  card: { border: `1pt solid #2A2438`, borderRadius: 10, backgroundColor: CARD, overflow: "hidden" },
  band: { height: 8 },
  head: { padding: 20, borderBottom: `1pt solid #2A2438` },
  brand: { fontSize: 8, letterSpacing: 3, color: MUTED, marginBottom: 6 },
  wordmark: { fontSize: 24, fontFamily: "Helvetica-Bold", letterSpacing: 2 },
  eventLine: { fontSize: 9, color: MUTED, marginTop: 6 },

  body: { flexDirection: "row", padding: 20 },
  left: { flex: 1, paddingRight: 18 },
  right: { width: 172, alignItems: "center" },

  passLabel: { fontSize: 20, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  strap: { fontSize: 8, letterSpacing: 2, marginTop: 4, textTransform: "uppercase" },

  holderLabel: { fontSize: 7, letterSpacing: 2, color: FAINT, marginTop: 18, textTransform: "uppercase" },
  holder: { fontSize: 16, fontFamily: "Helvetica-Bold", marginTop: 3 },
  sub: { fontSize: 9, color: MUTED, marginTop: 3 },

  admitsTitle: { fontSize: 7, letterSpacing: 2, color: FAINT, marginTop: 16, textTransform: "uppercase" },
  admitRow: { flexDirection: "row", marginTop: 4 },
  admitDot: { fontSize: 8, marginRight: 5 },
  admitText: { fontSize: 9, color: MUTED },

  qrBox: { backgroundColor: "#FFFFFF", padding: 9, borderRadius: 6 },
  qr: { width: 150, height: 150 },
  ticketNo: { fontSize: 7, color: FAINT, marginTop: 8, fontFamily: "Courier" },

  dayStrip: { flexDirection: "row", marginTop: 16, gap: 5 },
  day: { flex: 1, borderRadius: 4, paddingVertical: 5, alignItems: "center", border: `1pt solid #2A2438` },
  dayOn: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  dayOff: { fontSize: 8, color: "#3E3752" },

  concert: { marginTop: 12, padding: 8, borderRadius: 5, fontSize: 8 },

  foot: { flexDirection: "row", justifyContent: "space-between", padding: "12 20", borderTop: `1pt solid #2A2438` },
  footText: { fontSize: 7, color: FAINT },

  notice: { marginTop: 14, fontSize: 7.5, color: FAINT, lineHeight: 1.5 },
});

function PassDoc({ data, qrDataUrl }: { data: PassData; qrDataUrl: string }) {
  const style = PASS_STYLES[data.tier];
  const ev = EVENT_META[data.event];
  const days = passDays(data.event);
  const concert = concertLine(data.tier, !!data.socials);
  const concertOk = concert?.startsWith("Concert included");

  return (
    <Document title={`${style.label} — ${data.holderName}`} author="The Colosseum">
      <Page size="A5" orientation="landscape" style={s.page}>
        <View style={s.card}>
          <View style={[s.band, { backgroundColor: style.accent }]} />

          <View style={s.head}>
            <Text style={s.brand}>MIUC · ROOTS</Text>
            <Text style={s.wordmark}>THE COLOSSEUM</Text>
            <Text style={s.eventLine}>
              {ev.name} · {ev.dates} · MIUC Flagship Campus H-8, Islamabad
            </Text>
          </View>

          <View style={s.body}>
            <View style={s.left}>
              <Text style={[s.passLabel, { color: style.accent }]}>
                {style.icon}  {style.label.toUpperCase()}
              </Text>
              <Text style={[s.strap, { color: style.accentDeep }]}>{style.strapline}</Text>

              <Text style={s.holderLabel}>Holder</Text>
              <Text style={s.holder}>{data.holderName}</Text>
              {data.institution ? <Text style={s.sub}>{data.institution}</Text> : null}
              {data.gameName ? (
                <Text style={s.sub}>
                  {data.gameName}{data.teamName ? ` · ${data.teamName}` : ""}
                </Text>
              ) : null}
              {data.vehicle ? <Text style={s.sub}>{data.vehicle}{data.plate ? ` · ${data.plate}` : ""}</Text> : null}

              <Text style={s.admitsTitle}>Admits to</Text>
              {style.admits.map((a) => (
                <View key={a} style={s.admitRow}>
                  <Text style={[s.admitDot, { color: style.accent }]}>•</Text>
                  <Text style={s.admitText}>{a}</Text>
                </View>
              ))}

              <View style={s.dayStrip}>
                {days.map((d) => (
                  <View
                    key={d.day}
                    style={[s.day, d.active ? { backgroundColor: style.accent, borderColor: style.accent } : {}]}
                  >
                    <Text style={d.active ? [s.dayOn, { color: "#0B0912" }] : s.dayOff}>{d.day}</Text>
                  </View>
                ))}
              </View>

              {concert ? (
                <Text
                  style={[
                    s.concert,
                    concertOk
                      ? { backgroundColor: "#17223A", color: "#8FD4FF" }
                      : { backgroundColor: "#2A1620", color: "#FF8FAE" },
                  ]}
                >
                  {concert}
                </Text>
              ) : null}
            </View>

            <View style={s.right}>
              <View style={s.qrBox}>
                <Image style={s.qr} src={qrDataUrl} />
              </View>
              <Text style={s.ticketNo}>{data.ticketNumber}</Text>
              <Text style={[s.ticketNo, { marginTop: 2 }]}>{data.qrToken.slice(0, 8).toUpperCase()}</Text>
              <Text style={s.notice}>
                One entry per day. Non-transferable and tied to this registration.
              </Text>
            </View>
          </View>

          <View style={s.foot}>
            <Text style={s.footText}>thecolosseumpk.vercel.app</Text>
            <Text style={s.footText}>Present this pass at the gate</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

/** Render a pass to a PDF Buffer. */
export async function renderPassPdf(data: PassData): Promise<Buffer> {
  const qrDataUrl = await generateQRDataURL(data.qrToken);
  return renderToBuffer(<PassDoc data={data} qrDataUrl={qrDataUrl} />);
}
