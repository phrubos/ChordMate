'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

function GuitarLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className="size-9"
    >
      <defs>
        <linearGradient id="guitarBodyLogin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <g transform="rotate(-40 256 256) translate(-20, 20)">
        <path d="M236,40 L276,40 L276,210 L236,210 Z" fill="#451a03" />
        <line x1="236" y1="60" x2="276" y2="60" stroke="#78350f" strokeWidth="3" />
        <line x1="236" y1="90" x2="276" y2="90" stroke="#78350f" strokeWidth="3" />
        <line x1="236" y1="120" x2="276" y2="120" stroke="#78350f" strokeWidth="3" />
        <line x1="236" y1="150" x2="276" y2="150" stroke="#78350f" strokeWidth="3" />
        <line x1="236" y1="180" x2="276" y2="180" stroke="#78350f" strokeWidth="3" />
        <path
          d="M236,40 L224,10 L228,-15 C232,-35 240,-40 256,-40 C272,-40 280,-35 284,-15 L288,10 L276,40 Z"
          fill="#291102"
        />
        <circle cx="216" cy="20" r="7" fill="#d4d4d8" />
        <circle cx="212" cy="-2" r="7" fill="#d4d4d8" />
        <circle cx="216" cy="-24" r="7" fill="#d4d4d8" />
        <circle cx="296" cy="20" r="7" fill="#d4d4d8" />
        <circle cx="300" cy="-2" r="7" fill="#d4d4d8" />
        <circle cx="296" cy="-24" r="7" fill="#d4d4d8" />
        <path
          d="M256,460 C350,460 390,400 370,330 C350,260 380,220 340,180 C300,140 212,140 172,180 C132,220 162,260 142,330 C122,400 162,460 256,460 Z"
          fill="url(#guitarBodyLogin)"
          stroke="#78350f"
          strokeWidth="6"
        />
        <path
          d="M260,280 C310,280 340,310 330,360 C320,410 280,430 250,430 C270,390 280,350 260,280 Z"
          fill="#451a03"
          opacity="0.8"
        />
        <circle cx="256" cy="270" r="48" fill="none" stroke="#fed7aa" strokeWidth="4" opacity="0.6" />
        <circle cx="256" cy="270" r="42" fill="none" stroke="#78350f" strokeWidth="2" opacity="0.8" />
        <circle cx="256" cy="270" r="38" fill="#110d0a" />
        <rect x="206" y="380" width="100" height="24" rx="6" fill="#291102" />
        <rect x="216" y="386" width="80" height="4" rx="2" fill="#d4d4d8" />
        <line x1="236" y1="-20" x2="236" y2="390" stroke="#fcd34d" strokeWidth="2" opacity="0.8" />
        <line x1="244" y1="-20" x2="244" y2="390" stroke="#fcd34d" strokeWidth="1.8" opacity="0.75" />
        <line x1="252" y1="-20" x2="252" y2="390" stroke="#fcd34d" strokeWidth="1.5" opacity="0.7" />
        <line x1="260" y1="-20" x2="260" y2="390" stroke="#e4e4e7" strokeWidth="1.2" opacity="0.6" />
        <line x1="268" y1="-20" x2="268" y2="390" stroke="#e4e4e7" strokeWidth="1" opacity="0.5" />
        <line x1="276" y1="-20" x2="276" y2="390" stroke="#e4e4e7" strokeWidth="0.8" opacity="0.4" />
      </g>
    </svg>
  );
}

export function LoginForm() {
  const showGitHub = !!process.env.NEXT_PUBLIC_GITHUB_ENABLED;
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  const handleGithubSignIn = async () => {
    setIsGithubLoading(true);
    await signIn('github', { callbackUrl: '/dashboard' });
  };

  return (
    <motion.div
      className="relative z-10 w-full max-w-md px-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="login-card rounded-3xl p-10">
        {/* Logo */}
        <motion.div className="mb-10 flex flex-col items-center gap-4" variants={itemVariants}>
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 shadow-lg shadow-primary/5">
            <GuitarLogo />
          </div>
          <div className="text-center">
            <h1 className="shimmer-text text-3xl font-bold tracking-tight">ChordMate</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Gyakorolj együtt a haveroddal
            </p>
          </div>
        </motion.div>

        {/* Divider */}
        <motion.div className="mb-8 flex items-center gap-3" variants={itemVariants}>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground/50">
            Bejelentkezés
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </motion.div>

        {/* Auth buttons */}
        <motion.div className="flex flex-col gap-4" variants={itemVariants}>
          <Button
            id="login-google-btn"
            variant="outline"
            isLoading={isGoogleLoading}
            disabled={isGithubLoading}
            className="group h-12 w-full gap-3 rounded-xl border-border/50 bg-card/50 text-sm font-medium transition-all duration-300 hover:bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            onClick={handleGoogleSignIn}
          >
            <svg viewBox="0 0 24 24" className="size-5 shrink-0 transition-transform duration-300 group-hover:scale-110">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Bejelentkezés Google-lel
          </Button>
          {showGitHub && (
            <Button
              id="login-github-btn"
              variant="outline"
              isLoading={isGithubLoading}
              disabled={isGoogleLoading}
              className="group h-12 w-full gap-3 rounded-xl border-border/50 bg-card/50 text-sm font-medium transition-all duration-300 hover:bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              onClick={handleGithubSignIn}
            >
            <svg viewBox="0 0 24 24" className="size-5 shrink-0 transition-transform duration-300 group-hover:scale-110" fill="currentColor">
               <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
              Bejelentkezés GitHub-bal
            </Button>
          )}
        </motion.div>

        {/* Footer */}
        <motion.p
          className="mt-8 text-center text-xs text-muted-foreground/40"
          variants={itemVariants}
        >
          Bejelentkezéssel elfogadod a{' '}
          <span className="text-muted-foreground/60 hover:text-primary/80 cursor-pointer transition-colors">
            használati feltételeket
          </span>
        </motion.p>
      </div>
    </motion.div>
  );
}
