import { forwardRef, type ReactNode } from 'react';
import { TabSheet } from '@/components/song-hub/tab-sheet';
import type { Song } from '@/types';

interface PracticeSheetProps {
  song: Song;
  fontSize: number;
  /** Mobile: song info that scrolls away with the tab instead of pinning the top of the screen. */
  header?: ReactNode;
}

/** Large, scrollable tab — the auto-scroll target. */
export const PracticeSheet = forwardRef<HTMLElement, PracticeSheetProps>(function PracticeSheet({ song, fontSize, header }, ref) {
  return (
    <section ref={ref} tabIndex={0} aria-label="Kotta" className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5 outline-none md:px-12 md:py-10">
      {header && <div className="-mx-4 -mt-5 mb-5 border-b border-border px-4 py-4 md:hidden">{header}</div>}
      {song.tabContent ? (
        <TabSheet tabContent={song.tabContent} fontSize={fontSize} />
      ) : (
        <div className="grid flex-1 place-items-center text-center text-sm text-muted-foreground">
          <p>
            Ehhez a dalhoz nincs tab.
            {song.tabUrl && (
              <>
                {' '}
                <a href={song.tabUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-text hover:underline">
                  Külső tab megnyitása
                </a>
              </>
            )}
          </p>
        </div>
      )}
    </section>
  );
});
