import { ChevronRight } from 'lucide-react';
import { CoverArt } from '@/components/design/cover-art';
import { ChipList } from '@/components/design/chip';
import { ChordDiagram } from '@/components/design/chord-diagram';
import { Eyebrow } from '@/components/design/eyebrow';
import { chordDiagrams } from '@/lib/chord-diagrams';
import { extractChords } from '@/lib/chords';
import { cn } from '@/lib/utils';
import type { Song } from '@/types';

const chipsOf = (s: Song) => [s.songKey, s.bpm ? `${s.bpm} BPM` : null, s.capo ? `Capo ${s.capo}` : null, s.tuning && !/standard/i.test(s.tuning) ? s.tuning : null];

interface PracticeInfoProps {
  song: Song;
  next?: Song;
  label: string;
  onNext: () => void;
  /** 'side': large-screen left column (cover, "Következő" card); 'inline': compact block above the tab. */
  variant: 'side' | 'inline';
}

/** Song info: cover, title, chips, chord boxes and (side variant) the "Következő" card. */
export function PracticeInfo({ song, next, label, onNext, variant }: PracticeInfoProps) {
  const chords = extractChords(song.tabContent).filter((c) => c in chordDiagrams);
  const side = variant === 'side';
  return (
    <div className={cn('flex min-w-0 flex-col', side ? 'h-full gap-4' : 'gap-3')}>
      {side && <CoverArt title={song.title} artist={song.artist} imageUrl={song.imageUrl} size="fill" showType className="size-[132px]!" />}
      {side && <Eyebrow>{label}</Eyebrow>}
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className={cn('display-soft font-display leading-tight font-normal tracking-[-0.02em] italic', side ? 'text-[38px]' : 'truncate text-[28px]')} title={song.title}>
          {song.title}
        </h1>
        <p className="text-[15px] text-muted-foreground">{song.artist}</p>
      </div>
      <ChipList items={chipsOf(song)} />
      {chords.length > 0 && (
        <ul className={side ? 'grid grid-cols-4 gap-2' : '-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 md:-mx-12 md:px-12'}>
          {chords.map((c) => (
            <li key={c} className="shrink-0">
              <ChordDiagram name={c} size="sm" className={side ? 'px-1' : undefined} />
            </li>
          ))}
        </ul>
      )}
      {side && next && (
        <div className="mt-auto flex flex-col gap-2 pt-6">
          <Eyebrow>Következő</Eyebrow>
          <button
            type="button"
            onClick={onNext}
            className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-border-strong p-2.5 text-left transition-transform duration-(--dur-press) ease-(--ease-out) hover:border-ring active:scale-[.97]"
          >
            <CoverArt title={next.title} artist={next.artist} imageUrl={next.imageUrl} size="sm" />
            <span className="flex min-w-0 flex-col leading-tight">
              <b className="display-soft truncate font-display text-[17px] font-medium">{next.title}</b>
              <small className="truncate text-[13px] text-muted-foreground">{[next.artist, next.songKey, next.bpm && `${next.bpm} BPM`].filter(Boolean).join(' · ')}</small>
            </span>
            <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
