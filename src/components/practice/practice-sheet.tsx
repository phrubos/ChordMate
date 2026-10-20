import { forwardRef } from 'react';
import { TabSheet } from '@/components/song-hub/tab-sheet';
import type { Song } from '@/types';

/** Large, scrollable tab — the auto-scroll target. */
export const PracticeSheet = forwardRef<HTMLElement, { song: Song }>(function PracticeSheet({ song }, ref) {
  return (
    <section ref={ref} tabIndex={0} aria-label="Kotta" className="min-h-0 flex-1 overflow-y-auto px-4 py-5 outline-none md:px-12 md:py-10">
      {song.tabContent ? (
        <TabSheet tabContent={song.tabContent} className="text-[15px] md:text-[18px]" />
      ) : (
        <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
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
