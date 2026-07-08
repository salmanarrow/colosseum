import type { Metadata } from "next";
import { Anton, Space_Grotesk, Geist_Mono } from "next/font/google";
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
  title: "ROOTS × MIUC: The Colosseum",
  description:
    "Pakistan's premier collegiate e-sports championship. 9 titles. 3 days. One arena. Register your squad or get your spectator pass.",
  metadataBase: new URL("https://thecolosseumpk.vercel.app"),
  openGraph: {
    title: "ROOTS × MIUC: The Colosseum",
    description: "Pakistan's premier collegiate e-sports championship.",
    siteName: "The Colosseum",
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
      <body>{children}</body>
    </html>
  );
}
