import { chordDiagrams } from '@/lib/chord-diagrams';
import { cn } from '@/lib/utils';

const W = 60;
const H = 74;
const X0 = 10;
const Y0 = 16;
const SW = 44 / 5;
const FH = 11.5;
const xs = (i: number) => X0 + i * SW;

/** Guitar chord box (SVG) from lib/chord-diagrams data. Returns null for unknown chords. */
export function ChordDiagram({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md'; className?: string }) {
  const chord = chordDiagrams[name];
  if (!chord) return null;
  const { frets, fingers, baseFret } = chord;
  const rel = (f: number) => (baseFret > 1 ? f - baseFret + 1 : f);

  const barreStrings = frets.map((f, i) => (fingers[i] === 1 && f > 0 ? i : -1)).filter((i) => i >= 0);
  const barreFret = barreStrings.length >= 2 ? frets[barreStrings[0]] : null;
  const isBarre = (i: number) => barreFret !== null && fingers[i] === 1 && frets[i] === barreFret;

  return (
    <figure className={cn('m-0 flex flex-col items-center gap-0.5 rounded-md border border-border-strong px-2 pt-2 pb-1.5', className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${name} akkord`}
        className={size === 'sm' ? 'h-[58px] w-12' : 'h-[66px] w-[54px]'}
      >
        {baseFret > 1 ? (
          <text x={1} y={Y0 + FH * 0.75} className="fill-muted-foreground font-mono text-[7px]">{baseFret}</text>
        ) : (
          <rect x={X0 - 0.5} y={Y0 - 3} width={45} height={3} rx={1} className="fill-foreground" />
        )}
        {Array.from({ length: 6 }, (_, f) => (
          <line key={`f${f}`} x1={X0} x2={X0 + 44} y1={Y0 + f * FH} y2={Y0 + f * FH} className="stroke-faint" strokeWidth={0.8} />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <line key={`s${i}`} x1={xs(i)} x2={xs(i)} y1={Y0} y2={Y0 + 5 * FH} className="stroke-faint" strokeWidth={0.8} />
        ))}
        {barreFret !== null && (
          <rect
            x={xs(barreStrings[0]) - 3.6}
            y={Y0 + (rel(barreFret) - 0.5) * FH - 3.6}
            width={xs(barreStrings[barreStrings.length - 1]) - xs(barreStrings[0]) + 7.2}
            height={7.2}
            rx={3.6}
            className="fill-primary"
          />
        )}
        {frets.map((f, i) => {
          if (f === -1) return <text key={i} x={xs(i)} y={Y0 - 6} textAnchor="middle" className="fill-faint font-mono text-[8px]">×</text>;
          if (f === 0) return <circle key={i} cx={xs(i)} cy={Y0 - 8} r={2.4} fill="none" className="stroke-muted-foreground" strokeWidth={1.1} />;
          if (isBarre(i)) return null;
          return <circle key={i} cx={xs(i)} cy={Y0 + (rel(f) - 0.5) * FH} r={3.6} className="fill-primary" />;
        })}
      </svg>
      <figcaption className="font-mono text-sm font-semibold">{name}</figcaption>
    </figure>
  );
}
