'use client';

import { SongForm } from '@/components/songs/song-form';
import { fixtureSongs } from '../fixtures';

export function FormSection() {
  return (
    <section id="form">
      <SongForm song={{ ...fixtureSongs[2], notes: 'Hendrix-féle díszítések a 2. versszakban.' }} />
    </section>
  );
}
