'use client';

import { useMemo } from 'react';
import { ChordTooltip } from '@/components/shared/chord-tooltip';
import { splitChordText } from '@/lib/chords';
import { cn } from '@/lib/utils';

/** Monospace tab with highlighted, hoverable chords. */
export function TabSheet({ tabContent, fontSize = 14, className }: { tabContent: string; fontSize?: number; className?: string }) {
  const parts = useMemo(() => splitChordText(tabContent), [tabContent]);
  return (
    <pre className={cn('overflow-x-auto font-mono leading-[1.7] whitespace-pre text-foreground/90', className)} style={{ fontSize }}>
      {parts.map((p, i) =>
        p.isChord ? (
          <ChordTooltip key={i} chordName={p.text}>
            <span className="cursor-help font-semibold text-primary-text">{p.text}</span>
          </ChordTooltip>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </pre>
  );
}
