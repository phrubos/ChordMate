'use client';

import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';

/* ───────────────── Config ───────────────── */

const PARTICLE_COUNT = 18;
const CHORD_NAMES = ['Am', 'G', 'C', 'D', 'Em', 'F', 'Dm', 'E'];

// Deterministic pseudo-random based on seed
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

/* ───────────────── Sub-components ───────────────── */

function AnimatedBackground() {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Slow-moving wave lines
  const waveOffset = interpolate(frame, [0, durationInFrames], [0, 360], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      {/* Animated wave lines */}
      <svg
        viewBox="0 0 1080 1080"
        style={{ position: 'absolute', inset: 0, opacity: 0.06 }}
      >
        {[0, 1, 2, 3, 4].map((i) => {
          const yBase = 200 + i * 180;
          const phase = waveOffset + i * 30;
          const d = `M0,${yBase} Q270,${yBase + Math.sin((phase * Math.PI) / 180) * 40} 540,${yBase} T1080,${yBase}`;
          return (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={1.5}
            />
          );
        })}
      </svg>

      {/* Large ambient glow */}
      <div
        style={{
          position: 'absolute',
          width: '60%',
          height: '60%',
          left: '20%',
          top: '20%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)',
          filter: 'blur(80px)',
          opacity: interpolate(
            frame,
            [0, durationInFrames / 2, durationInFrames],
            [0.5, 1, 0.5],
            { extrapolateRight: 'clamp' }
          ),
        }}
      />
    </AbsoluteFill>
  );
}

function GuitarIcon() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Spring entrance
  const entranceProgress = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80, mass: 1.2 },
  });

  const scale = interpolate(entranceProgress, [0, 1], [0.3, 1]);
  const rotation = interpolate(entranceProgress, [0, 1], [-15, 0]);

  // Gentle float after entrance
  const floatY = interpolate(
    frame % (fps * 4),
    [0, fps * 2, fps * 4],
    [0, -12, 0],
    { extrapolateRight: 'clamp' }
  );

  // Subtle glow pulse
  const glowOpacity = interpolate(
    frame % (fps * 3),
    [0, fps * 1.5, fps * 3],
    [0.3, 0.7, 0.3],
    { extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) translateY(${floatY}px) scale(${scale}) rotate(${rotation}deg)`,
        width: 340,
        height: 340,
      }}
    >
      {/* Glow behind guitar */}
      <div
        style={{
          position: 'absolute',
          inset: -60,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(245,158,11,0.25) 0%, transparent 70%)',
          filter: 'blur(40px)',
          opacity: glowOpacity,
        }}
      />
      {/* Guitar SVG */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 30px rgba(245,158,11,0.3))' }}
      >
        <defs>
          <linearGradient id="guitarBodyAnim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <filter id="innerShadowAnim">
            <feOffset dx="0" dy="8" />
            <feGaussianBlur stdDeviation="6" result="offset-blur" />
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
            <feFlood floodColor="black" floodOpacity="0.8" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
          </filter>
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
            fill="url(#guitarBodyAnim)"
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
          <circle cx="256" cy="270" r="38" fill="#110d0a" filter="url(#innerShadowAnim)" />

          <rect x="206" y="380" width="100" height="24" rx="6" fill="#291102" />
          <rect x="216" y="386" width="80" height="4" rx="2" fill="#d4d4d8" />
          <circle cx="236" cy="396" r="3" fill="#000" />
          <circle cx="244" cy="396" r="3" fill="#000" />
          <circle cx="252" cy="396" r="3" fill="#000" />
          <circle cx="260" cy="396" r="3" fill="#000" />
          <circle cx="268" cy="396" r="3" fill="#000" />
          <circle cx="276" cy="396" r="3" fill="#000" />

          <line x1="236" y1="-20" x2="236" y2="390" stroke="#fcd34d" strokeWidth="2" opacity="0.8" />
          <line x1="244" y1="-20" x2="244" y2="390" stroke="#fcd34d" strokeWidth="1.8" opacity="0.75" />
          <line x1="252" y1="-20" x2="252" y2="390" stroke="#fcd34d" strokeWidth="1.5" opacity="0.7" />
          <line x1="260" y1="-20" x2="260" y2="390" stroke="#e4e4e7" strokeWidth="1.2" opacity="0.6" />
          <line x1="268" y1="-20" x2="268" y2="390" stroke="#e4e4e7" strokeWidth="1" opacity="0.5" />
          <line x1="276" y1="-20" x2="276" y2="390" stroke="#e4e4e7" strokeWidth="0.8" opacity="0.4" />
        </g>
      </svg>
    </div>
  );
}

function Particles() {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        const seed = i + 1;
        const startX = seededRandom(seed * 1) * 100;
        const startY = seededRandom(seed * 2) * 100;
        const size = 2 + seededRandom(seed * 3) * 6;
        const delay = Math.floor(seededRandom(seed * 4) * durationInFrames * 0.6);
        const duration = fps * (2 + seededRandom(seed * 5) * 3);

        const loopFrame = (frame + delay) % (duration + fps);
        const opacity = interpolate(
          loopFrame,
          [0, duration * 0.2, duration * 0.8, duration],
          [0, 0.6, 0.6, 0],
          { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
        );

        const y = interpolate(loopFrame, [0, duration], [0, -80], {
          extrapolateRight: 'clamp',
        });

        const x = interpolate(loopFrame, [0, duration], [0, (seededRandom(seed * 6) - 0.5) * 40], {
          extrapolateRight: 'clamp',
        });

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${startX}%`,
              top: `${startY}%`,
              width: size,
              height: size,
              borderRadius: '50%',
              background:
                seededRandom(seed * 7) > 0.5
                  ? 'radial-gradient(circle, #fbbf24, #f59e0b)'
                  : 'radial-gradient(circle, #fde68a, #fbbf24)',
              opacity,
              transform: `translate(${x}px, ${y}px)`,
              boxShadow: `0 0 ${size * 2}px rgba(245,158,11,0.4)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}

function FloatingChords() {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {CHORD_NAMES.map((chord, i) => {
        const seed = (i + 1) * 100;
        const startDelay = Math.floor(seededRandom(seed) * durationInFrames * 0.7);
        const travelDuration = fps * (4 + seededRandom(seed + 1) * 4);
        const yPos = 10 + seededRandom(seed + 2) * 80;
        const fontSize = 16 + seededRandom(seed + 3) * 20;

        const loopFrame = (frame + startDelay) % (travelDuration + fps * 2);

        const xPos = interpolate(loopFrame, [0, travelDuration], [105, -15], {
          extrapolateRight: 'clamp',
          easing: Easing.linear,
        });

        const opacity = interpolate(
          loopFrame,
          [0, travelDuration * 0.1, travelDuration * 0.85, travelDuration],
          [0, 0.35, 0.35, 0],
          { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
        );

        // Gentle vertical oscillation
        const floatY = interpolate(
          loopFrame % (fps * 3),
          [0, fps * 1.5, fps * 3],
          [0, -8, 0],
          { extrapolateRight: 'clamp' }
        );

        return (
          <div
            key={chord}
            style={{
              position: 'absolute',
              left: `${xPos}%`,
              top: `${yPos}%`,
              transform: `translateY(${floatY}px)`,
              fontSize,
              fontFamily: 'var(--font-geist-mono), monospace',
              fontWeight: 700,
              color: '#f59e0b',
              opacity,
              textShadow: '0 0 20px rgba(245,158,11,0.3)',
              letterSpacing: '0.05em',
            }}
          >
            {chord}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

/* Musical note symbols floating */
function FloatingNotes() {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const notes = ['♪', '♫', '♬', '♩', '♪', '♫'];

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {notes.map((note, i) => {
        const seed = (i + 1) * 200;
        const startDelay = Math.floor(seededRandom(seed) * durationInFrames * 0.8);
        const duration = fps * (3 + seededRandom(seed + 1) * 3);
        const xPos = 10 + seededRandom(seed + 2) * 80;
        const fontSize = 20 + seededRandom(seed + 3) * 28;

        const loopFrame = (frame + startDelay) % (duration + fps * 2);

        const y = interpolate(loopFrame, [0, duration], [100, -10], {
          extrapolateRight: 'clamp',
        });

        const opacity = interpolate(
          loopFrame,
          [0, duration * 0.15, duration * 0.75, duration],
          [0, 0.3, 0.3, 0],
          { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
        );

        const rotate = interpolate(loopFrame, [0, duration], [0, (seededRandom(seed + 4) - 0.5) * 30], {
          extrapolateRight: 'clamp',
        });

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${xPos}%`,
              top: `${y}%`,
              fontSize,
              color: '#d97706',
              opacity,
              transform: `rotate(${rotate}deg)`,
              textShadow: '0 0 15px rgba(217,119,6,0.4)',
            }}
          >
            {note}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

/* ───────────────── Main Composition ───────────────── */

export const GuitarScene: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: 'transparent',
        overflow: 'hidden',
        WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 70%)',
        maskImage: 'radial-gradient(circle at center, black 30%, transparent 70%)',
      }}
    >
      <AnimatedBackground />
      <Particles />
      <FloatingNotes />
      <FloatingChords />
      <GuitarIcon />
    </AbsoluteFill>
  );
};
