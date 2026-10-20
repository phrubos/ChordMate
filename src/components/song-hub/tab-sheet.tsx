'use client';

import { useMemo } from 'react';
import { ChordTooltip } from '@/components/shared/chord-tooltip';
import { splitChordText } from '@/lib/chords';
import { cn } from '@/lib/utils';

/** Monospace tab with highlighted, hoverable chords. */
export function TabSheet({ tabContent, fontSize, className }: { tabContent: string; fontSize?: number; className?: string }) {
  const parts = useMemo(() => splitChordText(tabContent), [tabContent]);
  return (
    <pre className={cn('overflow-x-auto font-mono text-[14px] leading-[1.7] whitespace-pre text-foreground/90', className)} style={fontSize ? { fontSize } : undefined}>
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
