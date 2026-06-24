import { Resend } from "resend";
import { generateQRDataURL } from "./qr";

const resend = new Resend(process.env.RESEND_API_KEY);

type TicketEmailParams = {
  to: string;
  recipientName: string;
  ticketNumber: string;
  tier: "participant" | "basic" | "spectator";
  gameName?: string;
  teamName?: string;
  qrToken: string;
};

export async function sendTicketEmail(params: TicketEmailParams) {
  const qrDataUrl = await generateQRDataURL(params.qrToken);
  // Strip data URL prefix to get raw base64
  const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, "");

  const passLabel = params.tier === "participant" ? "Gladiator Pass" : "Citizen Pass";
  const gameInfo  = params.gameName ? `<p style="color:#93A4B8;font-size:14px;margin:4px 0 0;">${params.gameName}${params.teamName ? ` · ${params.teamName}` : ""}</p>` : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A1628;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A1628;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0E1A2B;border:1px solid rgba(255,255,255,0.08);border-radius:18px;overflow:hidden;max-width:560px;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0A1628,#1a0a30);padding:32px;text-align:center;border-bottom:1px solid rgba(245,200,66,0.3);">
          <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#00C2A8;">ROOTS × MIUC</p>
          <h1 style="margin:0;font-size:32px;font-weight:900;letter-spacing:0.04em;text-transform:uppercase;color:#F4F7FB;">THE COLOSSEUM</h1>
          <p style="margin:8px 0 0;font-size:13px;color:#93A4B8;">Aug 7 – 9, 2026 · ROOTS H-8 Campus, Islamabad</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 6px;font-size:13px;color:#93A4B8;">Hello,</p>
          <h2 style="margin:0 0 24px;font-size:22px;color:#F4F7FB;font-weight:700;">${params.recipientName}</h2>

          <p style="margin:0 0 24px;font-size:15px;color:#93A4B8;line-height:1.6;">
            Your payment has been confirmed. Your entry pass is ready below.
            Present this QR code at the venue gate on arrival.
          </p>

          <!-- Pass card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(20,35,50,0.8);border:1px solid rgba(245,200,66,0.35);border-radius:12px;margin-bottom:24px;">
            <tr><td style="padding:24px;">
              <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#F5C842;">Your Pass</p>
              <h3 style="margin:0 0 4px;font-size:24px;font-weight:900;letter-spacing:0.04em;text-transform:uppercase;color:#F4F7FB;">${passLabel}</h3>
              ${gameInfo}
              <p style="margin:16px 0 0;font-size:11px;font-family:monospace;color:#5C6F86;">${params.ticketNumber}</p>
            </td></tr>
          </table>

          <!-- QR code -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td align="center" style="background:#F4F7FB;border-radius:12px;padding:20px;">
              <img src="cid:qrcode" width="200" height="200" alt="Entry QR Code" style="display:block;" />
              <p style="margin:12px 0 0;font-size:11px;color:#0A1628;font-family:monospace;">${params.qrToken.slice(0, 8).toUpperCase()}</p>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,194,168,0.08);border:1px solid rgba(0,194,168,0.2);border-radius:10px;margin-bottom:24px;">
            <tr><td style="padding:16px 20px;">
              <p style="margin:0;font-size:13px;color:#93A4B8;line-height:1.6;">
                📌 This QR code is your entry pass. Present it at the venue gate on each day of attendance.
                The pass is non-transferable and linked to your registration.
              </p>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <p style="margin:0;font-size:11px;color:#5C6F86;font-family:monospace;">
            thecolosseum.pk · Organized by MIUC · Hosted at ROOTS H-8, Islamabad
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return resend.emails.send({
    from: "The Colosseum <tickets@thecolosseum.pk>",
    to: params.to,
    subject: `⚔️ Your ${passLabel} — The Colosseum 2026`,
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
