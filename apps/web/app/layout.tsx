import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

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
    <html lang="en" className={jetbrainsMono.variable}>
      <body className="font-mono antialiased bg-slate-950 text-slate-200 min-h-screen">
        {children}
      </body>
    </html>
  );
}
