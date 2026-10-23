'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { useStoredNumber } from '@/hooks/use-stored-number';
import { SectionHeader } from '@/components/design/section-header';
import { SegmentedControl } from '@/components/design/segmented-control';
import { cn } from '@/lib/utils';
import type { Song } from '@/types';
import { ChordStrip } from './chord-strip';
import { TabSheet } from './tab-sheet';
import { HistoryTimeline } from './history-timeline';
import { HubRecordings, type HubRecording } from './hub-recordings';
import { HubVideo } from './hub-video';
import { TabSizeControl } from './tab-size-control';

type HubTab = 'chords' | 'video' | 'history' | 'recordings';

const TABS: { value: HubTab; label: string }[] = [
  { value: 'chords', label: 'Akkordok' },
  { value: 'video', label: 'Videó' },
  { value: 'history', label: 'Előzmények' },
  { value: 'recordings', label: 'Felvételek' },
];

interface HubBodyProps {
  song: Song;
  chords: string[];
  history: string[];
  recordings: HubRecording[];
  today: string;
}

/** Desktop: chords + sheet left, video / history / recordings right. Mobile: one tab at a time. */
export function HubBody({ song, chords, history, recordings, today }: HubBodyProps) {
  const [tab, setTab] = useState<HubTab>('chords');
  const [storedSize, setFontSize] = useStoredNumber('chordmate:hub-tab-size');
  const fontSize = storedSize ?? 14;
  const panel = (t: HubTab) => cn('flex flex-col gap-5', tab !== t && 'max-md:hidden');

  return (
    <div className="flex flex-col gap-6">
      <SegmentedControl<HubTab> ariaLabel="Song Hub nézet" size="sm" value={tab} onChange={setTab} options={TABS} className="w-full md:hidden" />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] md:gap-x-12">
        <div className={panel('chords')}>
          <section className="flex flex-col gap-4">
            <SectionHeader title={<>Akkordok <span className="text-faint">{chords.length}</span></>} />
            <ChordStrip chords={chords} />
          </section>
          <section className="flex flex-col gap-4">
            <SectionHeader
              title="Kotta & tab"
              actions={
                song.tabContent && <TabSizeControl size={fontSize} onChange={setFontSize} />
              }
            />
            {song.tabContent ? (
              <TabSheet tabContent={song.tabContent} fontSize={fontSize} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Ehhez a dalhoz még nincs tab.
                {song.tabUrl && (
                  <>
                    {' '}
                    <a href={song.tabUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-text hover:underline">
                      Külső tab megnyitása
                    </a>
                  </>
                )}
              </p>
            )}
            {song.notes && (
              <div className="flex gap-3 rounded-md border border-border-strong p-4 text-[14px] leading-relaxed">
                <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <p className="whitespace-pre-line">{song.notes}</p>
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-10">
          <section className={panel('video')}>
            {song.youtubeUrl ? <HubVideo song={song} /> : <p className="text-sm text-muted-foreground">Ehhez a dalhoz nincs videó.</p>}
          </section>
          <section className={panel('history')}>
            <SectionHeader title="Próbákon" actions={<span className="font-mono text-[13px] text-muted-foreground">{history.filter((d) => d < today).length}×</span>} />
            <HistoryTimeline dates={history} today={today} />
          </section>
          <section className={panel('recordings')}>
            <SectionHeader title="Felvételek" />
            <HubRecordings recordings={recordings} />
          </section>
        </div>
      </div>
    </div>
  );
}
