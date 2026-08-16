import type { Metadata } from "next";
import { Anton, Space_Grotesk, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MIUC Colosseum",
  description:
    "Auto Show, Hackathon, Robotics, DJ Tokyo & Fireworks (5 Sept), then three days of gaming, cosplay and a concert (2–4 Oct). MIUC Flagship Campus H-8, Islamabad. Register now.",
  metadataBase: new URL("https://thecolosseumpk.vercel.app"),
  openGraph: {
    title: "MIUC Colosseum",
    description:
      "Two events. PreLaunch 5 Sept: Auto Show · Hackathon · Robotics · DJ Tokyo · Fireworks. The Colosseum 2–4 Oct: three days of gaming, cosplay, comedy and a concert.",
    siteName: "MIUC Colosseum",
    locale: "en_PK",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${anton.variable} ${geistMono.variable}`}
    >
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
