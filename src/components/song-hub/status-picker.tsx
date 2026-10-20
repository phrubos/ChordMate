'use client';

import { useOptimistic, useTransition } from 'react';
import { toast } from 'sonner';
import { SegmentedControl } from '@/components/design/segmented-control';
import { STATUS_BG } from '@/components/design/status-badge';
import { setSongStatus } from '@/actions/songs';
import { SONG_STATUSES, statusLabel, type SongStatus } from '@/lib/song-meta';

/** "Hol tartunk?" segment; saves optimistically and snaps back on error. */
export function StatusPicker({ songId, status }: { songId: string; status: SongStatus }) {
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [, startTransition] = useTransition();

  function change(next: SongStatus) {
    if (next === optimistic) return;
    startTransition(async () => {
      setOptimistic(next);
      try {
        await setSongStatus(songId, next);
      } catch {
        toast.error('Nem sikerült menteni');
      }
    });
  }

  return (
    <SegmentedControl<SongStatus>
      ariaLabel="Hol tartunk?"
      value={optimistic}
      onChange={change}
      options={SONG_STATUSES.map((s) => ({ value: s, label: statusLabel(s), dotClassName: STATUS_BG[s] }))}
    />
  );
}
