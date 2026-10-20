'use client';

import { useState } from 'react';
import { Plus, Play, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/design/eyebrow';
import { SectionHeader } from '@/components/design/section-header';
import { ChipList } from '@/components/design/chip';
import { StatusBadge } from '@/components/design/status-badge';
import { DifficultyMeter } from '@/components/design/difficulty-meter';
import { SegmentedControl } from '@/components/design/segmented-control';
import { CoverArt } from '@/components/design/cover-art';
import { ChordDiagram } from '@/components/design/chord-diagram';
import { AvatarStack } from '@/components/design/avatar-stack';
import { SONG_STATUSES, type SongStatus } from '@/lib/song-meta';
import { STATUS_BG } from '@/components/design/status-badge';
import { fixtureMembers, fixtureSongs } from '../fixtures';

export function AtomsSection() {
  const [status, setStatus] = useState<SongStatus | 'all'>('all');
  const long = fixtureSongs.find((s) => s.id === 'mostmulik')!;

  return (
    <section id="atoms" className="flex flex-col gap-10">
      <SectionHeader eyebrow="Alapelemek" title="Atomok" actions={<Button variant="ghost" size="icon" aria-label="Hozzáadás"><Plus /></Button>} />

      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg"><Play />Próba mód indítása</Button>
        <Button variant="outline" size="lg">Setlist lejátszása</Button>
        <Button>Új dal</Button>
        <Button variant="outline" size="sm">Szűrők</Button>
        <Button variant="ghost" size="icon" aria-label="Kedvenc"><Heart /></Button>
        <Button variant="destructive">Törlés</Button>
        <Button variant="link">Szerkesztés</Button>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <Eyebrow>Következő próba</Eyebrow>
        <Eyebrow accent>6 nap múlva</Eyebrow>
        <ChipList items={['Bm', '74 BPM', 'Capo 7', null]} />
        {SONG_STATUSES.map((s) => <StatusBadge key={s} status={s} />)}
        <StatusBadge status="ok" compact />
        {[1, 3, 5].map((l) => <DifficultyMeter key={l} level={l} />)}
        <AvatarStack users={fixtureMembers} />
      </div>

      <SegmentedControl
        ariaLabel="Státusz"
        value={status}
        onChange={setStatus}
        options={[
          { value: 'all', label: 'Mind', count: 12 },
          { value: 'learning', label: 'Tanuljuk', count: 3, dotClassName: STATUS_BG.learning },
          { value: 'ok', label: 'Megy', count: 5, dotClassName: STATUS_BG.ok },
          { value: 'ready', label: 'Kész', count: 4, dotClassName: STATUS_BG.ready },
        ]}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {fixtureSongs.map((s) => (
          <div key={s.id} className="flex min-w-0 flex-col gap-2">
            <div className="aspect-square"><CoverArt title={s.title} artist={s.artist} size="fill" showType /></div>
            <span className="display-soft truncate font-display text-[21px] font-medium" title={s.title}>{s.title}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {(['xs', 'sm', 'md'] as const).map((size) => <CoverArt key={size} title={long.title} artist={long.artist} size={size} />)}
        <span className="min-w-0 truncate text-[15px] font-semibold" title={long.title}>{long.title} — {long.artist} (hosszú cím csonkolása)</span>
      </div>

      <div className="flex flex-wrap gap-3">
        {['Bm', 'F#', 'A', 'E', 'G', 'D', 'Em'].map((c) => <ChordDiagram key={c} name={c} />)}
      </div>
    </section>
  );
}
