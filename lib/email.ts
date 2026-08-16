import { Resend } from "resend";
import nodemailer from "nodemailer";
import { generateQRDataURL } from "./qr";

// Provider selection: Gmail SMTP when GMAIL_USER/GMAIL_APP_PASSWORD are set
// (no domain required — free, ~500 emails/day), otherwise Resend with a
// verified domain (RESEND_API_KEY + RESEND_FROM). Both instantiate lazily so
// missing env vars never crash the build.

function gmailConfigured() {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function getGmailTransport() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER!,
      pass: process.env.GMAIL_APP_PASSWORD!,
    },
  });
}

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key || key === "re_your_key_here") throw new Error("No email provider configured (set GMAIL_USER + GMAIL_APP_PASSWORD, or a real RESEND_API_KEY)");
  return new Resend(key);
}

type TicketTier = "hackathon" | "game_entry" | "observer" | "cosplay";

const PASS_LABEL: Record<TicketTier, string> = {
  hackathon:  "Hackathon Pass",
  game_entry: "Game Entry Ticket",
  cosplay:    "Cosplay Entry",
  observer:   "Observer Pass",
};

type TicketEmailParams = {
  to: string;
  recipientName: string;
  ticketNumber: string;
  tier: TicketTier;
  event?: "prelaunch" | "colosseum";
  socials?: boolean;
  gameName?: string;
  teamName?: string;
  qrToken: string;
};

export async function sendTicketEmail(params: TicketEmailParams) {
  const qrDataUrl = await generateQRDataURL(params.qrToken);
  // Strip data URL prefix to get raw base64
  const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, "");

  const passLabel = PASS_LABEL[params.tier];
  const eventLine = params.event === "prelaunch"
    ? "PreLaunch · 5 September 2026"
    : "The Colosseum · 2 – 4 October 2026";
  const gameInfo  = params.gameName ? `<p style="color:#A9AFC0;font-size:14px;margin:4px 0 0;">${params.gameName}${params.teamName ? ` · ${params.teamName}` : ""}</p>` : "";
  const socialsLine = params.socials
    ? `<p style="color:#B026FF;font-size:13px;margin:8px 0 0;">🎤 Concert access included</p>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#07060B;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07060B;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0E0C14;border:1px solid rgba(255,255,255,0.08);border-radius:18px;overflow:hidden;max-width:560px;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#07060B,#1a0a30);padding:32px;text-align:center;border-bottom:1px solid rgba(200,205,217,0.3);">
          <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#B026FF;">ROOTS × MIUC</p>
          <h1 style="margin:0;font-size:32px;font-weight:900;letter-spacing:0.04em;text-transform:uppercase;color:#F4F2F8;">THE COLOSSEUM</h1>
          <p style="margin:8px 0 0;font-size:13px;color:#A9AFC0;">${eventLine} · MIUC Flagship Campus H-8, Islamabad</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 6px;font-size:13px;color:#A9AFC0;">Hello,</p>
          <h2 style="margin:0 0 24px;font-size:22px;color:#F4F2F8;font-weight:700;">${params.recipientName}</h2>

          <p style="margin:0 0 24px;font-size:15px;color:#A9AFC0;line-height:1.6;">
            Your payment has been confirmed. Your entry pass is ready below.
            Present this QR code at the venue gate on arrival.
          </p>

          <!-- Pass card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(22,18,32,0.8);border:1px solid rgba(200,205,217,0.35);border-radius:12px;margin-bottom:24px;">
            <tr><td style="padding:24px;">
              <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#C8CDD9;">Your Pass</p>
              <h3 style="margin:0 0 4px;font-size:24px;font-weight:900;letter-spacing:0.04em;text-transform:uppercase;color:#F4F2F8;">${passLabel}</h3>
              ${gameInfo}
              ${socialsLine}
              <p style="margin:16px 0 0;font-size:11px;font-family:monospace;color:#6C7385;">${params.ticketNumber}</p>
            </td></tr>
          </table>

          <!-- QR code -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td align="center" style="background:#F4F2F8;border-radius:12px;padding:20px;">
              <img src="cid:qrcode" width="200" height="200" alt="Entry QR Code" style="display:block;" />
              <p style="margin:12px 0 0;font-size:11px;color:#07060B;font-family:monospace;">${params.qrToken.slice(0, 8).toUpperCase()}</p>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(176,38,255,0.08);border:1px solid rgba(176,38,255,0.2);border-radius:10px;margin-bottom:24px;">
            <tr><td style="padding:16px 20px;">
              <p style="margin:0;font-size:13px;color:#A9AFC0;line-height:1.6;">
                📌 This QR code is your entry pass. Present it at the venue gate on each day of attendance.
                The pass is non-transferable and linked to your registration.
              </p>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <p style="margin:0;font-size:11px;color:#6C7385;font-family:monospace;">
            thecolosseumpk.vercel.app · Organized by MIUC · Hosted at MIUC Flagship Campus H-8, Islamabad
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const subject = `⚔️ Your ${passLabel} — MIUC Colosseum 2026`;

  if (gmailConfigured()) {
    return getGmailTransport().sendMail({
      from: `"The Colosseum" <${process.env.GMAIL_USER}>`,
      to: params.to,
      subject,
      html,
      attachments: [
        {
          filename: "entry-qr.png",
          content: Buffer.from(qrBase64, "base64"),
          cid: "qrcode",
        },
      ],
    });
  }

  return getResend().emails.send({
    from: process.env.RESEND_FROM ?? "The Colosseum <tickets@thecolosseum.pk>",
    to: params.to,
    subject,
    html,
    attachments: [
      {
        filename: "entry-qr.png",
        content: qrBase64,
        contentId: "qrcode",
      },
    ],
  });
}
