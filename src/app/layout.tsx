import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { PressFeedback } from "@/components/shared/press-feedback";
import { OnboardingCheck } from "@/components/band/onboarding-check";
import { needsOnboarding } from "@/actions/bands";
import NextTopLoader from "nextjs-toploader";
import { MotionProvider } from "@/components/providers/motion-provider";
import { HERO_SEEN_KEY } from "@/lib/motion";
import "./globals.css";

const fontDisplay = Fraunces({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  axes: ["SOFT", "opsz"],
  style: ["normal", "italic"],
});

const fontSans = Hanken_Grotesk({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});

const fontMono = IBM_Plex_Mono({
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "ChordMate — Gitárgyakorlás szervező",
  description: "Gyakorolj együtt a haveroddal! Közös dallista, naptár és YouTube lejátszó.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ChordMate",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#1d1a16" },
    { media: "(prefers-color-scheme: light)", color: "#f3eee3" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const needs = await needsOnboarding();

  return (
    <html lang="hu" className="dark" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* A8: skip the hero reveal on later loads in this session — must run before first paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem(${JSON.stringify(HERO_SEEN_KEY)}))document.documentElement.dataset.heroSeen=""}catch(e){}`,
          }}
        />
      </head>
      <body
        className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable} grain antialiased`}
      >
        <MotionProvider>
          <AuthSessionProvider>
            <NextTopLoader color="oklch(0.8 0.145 72)" showSpinner={false} height={2} shadow={false} />
            <TooltipProvider>
              <PressFeedback />
              <OnboardingCheck needsOnboardingServer={needs} />
              {children}
              <Toaster richColors position="bottom-right" visibleToasts={3} expand />
            </TooltipProvider>
          </AuthSessionProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
