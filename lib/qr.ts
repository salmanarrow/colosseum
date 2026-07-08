import QRCode from "qrcode";

// Generates a base64 PNG data URL for the given token.
// The QR encodes a verification URL that the scanner page reads.
export async function generateQRDataURL(token: string): Promise<string> {
  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://thecolosseumpk.vercel.app"}/verify/${token}`;
  return QRCode.toDataURL(verifyUrl, {
    width: 400,
    margin: 2,
    color: { dark: "#0A1628", light: "#F4F7FB" },
  });
}
