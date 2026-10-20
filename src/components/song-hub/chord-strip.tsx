import { ChordDiagram } from '@/components/design/chord-diagram';
import { chordDiagrams } from '@/lib/chord-diagrams';

/** One diagram per known chord; chords without a diagram are skipped. */
export function ChordStrip({ chords }: { chords: string[] }) {
  const known = chords.filter((c) => c in chordDiagrams);
  if (known.length === 0) return <p className="text-sm text-muted-foreground">A tabban nincs felismert akkord.</p>;
  return (
    <ul className="flex flex-wrap gap-3">
      {known.map((c) => (
        <li key={c}>
          <ChordDiagram name={c} />
        </li>
      ))}
    </ul>
  );
}
