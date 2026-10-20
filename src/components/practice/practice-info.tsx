import { format, parseISO } from 'date-fns';
import { hu } from 'date-fns/locale';
import { ChevronRight } from 'lucide-react';
import { CoverArt } from '@/components/design/cover-art';
import { ChipList } from '@/components/design/chip';
import { ChordDiagram } from '@/components/design/chord-diagram';
import { Eyebrow } from '@/components/design/eyebrow';
import { chordDiagrams } from '@/lib/chord-diagrams';
import { extractChords } from '@/lib/chords';
import type { Song } from '@/types';

const chipsOf = (s: Song) => [s.songKey, s.bpm ? `${s.bpm} BPM` : null, s.capo ? `Capo ${s.capo}` : null, s.tuning && !/standard/i.test(s.tuning) ? s.tuning : null];

/** Left column: cover, title, chips, chord boxes and the "Következő" card (desktop). */
export function PracticeInfo({ song, next, date, onNext }: { song: Song; next?: Song; date: string; onNext: () => void }) {
  const chords = extractChords(song.tabContent).filter((c) => c in chordDiagrams);
  return (
    <div className="flex min-w-0 flex-col gap-3 md:h-full md:gap-4">
      <CoverArt title={song.title} artist={song.artist} imageUrl={song.imageUrl} size="fill" showType className="hidden size-[132px]! md:block" />
      <Eyebrow className="hidden md:flex">{format(parseISO(date), 'MMM d.', { locale: hu })} próba</Eyebrow>
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="display-soft truncate font-display text-[28px] leading-tight font-normal tracking-[-0.02em] italic md:text-[38px] md:whitespace-normal" title={song.title}>
          {song.title}
        </h1>
        <p className="text-[15px] text-muted-foreground">{song.artist}</p>
      </div>
      <ChipList items={chipsOf(song)} />
      {chords.length > 0 && (
        <ul className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-4 md:gap-2 md:overflow-visible md:px-0">
          {chords.map((c) => (
            <li key={c} className="shrink-0">
              <ChordDiagram name={c} size="sm" className="md:px-1" />
            </li>
          ))}
        </ul>
      )}
      {next && (
        <div className="mt-auto hidden flex-col gap-2 pt-6 md:flex">
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
