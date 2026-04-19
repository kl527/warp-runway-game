import type { Metadata } from "next";
import { Geist, Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Warp Runway: Startup Survival",
  description:
    "Keyboard-driven ASCII startup simulator. Survive the burn, become a unicorn, or die trying.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geist.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-mono antialiased bg-slate-950 text-slate-200 min-h-screen">
        {children}
      </body>
    </html>
  );
}
