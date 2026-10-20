/** Tuning fork and metronome glyphs in Lucide style (not in lucide-react). */
export function TunerIcon({ className = 'size-[18px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M8 2v7a4 4 0 0 0 8 0V2" />
      <path d="M12 13v9" />
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
