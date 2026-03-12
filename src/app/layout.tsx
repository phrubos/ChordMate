import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { KeyboardShortcuts } from "@/components/shared/keyboard-shortcuts";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChordMate — Gitárgyakorlás szervező",
  description: "Gyakorolj együtt a haveroddal! Közös dallista, naptár és YouTube lejátszó.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthSessionProvider>
          <NextTopLoader color="#f59e0b" showSpinner={false} height={3} shadow="0 0 10px #f59e0b, 0 0 5px #f59e0b" />
          <TooltipProvider>
            <KeyboardShortcuts />
            {children}
            <Toaster richColors position="bottom-right" visibleToasts={1} />
          </TooltipProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
