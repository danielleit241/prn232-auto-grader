import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "PRN232 Auto Grader",
    template: "%s | PRN232 Auto Grader",
  },
  description:
    "Automated grading system for PRN232 programming assignments. Streamline your grading workflow with instant feedback and comprehensive test results.",
  keywords: [
    "auto grader",
    "programming",
    "assignment",
    "grading",
    "PRN232",
    "automated testing",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Navbar />
        <main style={{ flex: 1 }}>{children}</main>
      </body>
    </html>
  );
}
