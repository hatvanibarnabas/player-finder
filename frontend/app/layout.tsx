import type { Metadata } from "next";
import { Geist, Syne } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "PlayerFinder",
  description:
    "Keress Riot játékosokat, nézd a ranked adatokat, és értékeld a csapattársakat.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu">
      <body className={`${geist.variable} ${syne.variable} font-sans antialiased`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
