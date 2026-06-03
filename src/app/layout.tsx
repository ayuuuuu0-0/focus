import type { Metadata } from "next";
import { Chivo, Martian_Mono } from "next/font/google";
import "./globals.css";

const chivo = Chivo({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-chivo",
});

const martianMono = Martian_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-martian",
});

export const metadata: Metadata = {
  title: "fo.cus — daily command center",
  description: "Cyber-utilitarian focus dashboard with goals, reminders, and streaks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${chivo.variable} ${martianMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
