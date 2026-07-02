import type { Metadata } from "next";
import { Hanken_Grotesk, DM_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "DisbursePH — Merchant Dashboard",
  description: "Merchant disbursement management dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hankenGrotesk.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-background">
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster richColors />
        <Analytics />
      </body>
    </html>
  );
}
