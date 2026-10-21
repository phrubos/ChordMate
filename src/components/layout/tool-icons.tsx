import { GUITAR_BODY } from './logo';

/** Guitar and metronome glyphs in Lucide style (the guitar matches the brand mark). */
export function GuitarIcon({ className = 'size-[18px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <g transform="rotate(45 12 12)">
        <path d={GUITAR_BODY} />
        <circle cx="12" cy="14.3" r="1.3" />
        <path d="M12 9.5V4" />
        <path d="M10.7 1.2h2.6l-.3 2.8h-2z" />
        <path d="M10.4 19.4h3.2" />
      </g>
    </svg>
  );
}

export function MetronomeIcon({ className = 'size-[18px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M9 3h6l4 18H5z" />
      <path d="m12 17 5-11" />
      <path d="M7.5 14h9" />
    </svg>
  );
}
