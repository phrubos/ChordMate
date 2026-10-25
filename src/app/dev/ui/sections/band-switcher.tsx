'use client';

import { BandSwitcher } from '@/components/band/band-switcher';

// A tiny SVG "logo" so the image paths (thumbnail, lightbox) have something to show.
const logo = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#1d4ed8"/><circle cx="32" cy="32" r="18" fill="#facc15"/><text x="32" y="38" font-size="16" text-anchor="middle" font-family="sans-serif" fill="#1d4ed8">DS</text></svg>'
)}`;

const bands = [
  { id: 'b1', name: 'DadStar', logoData: logo, role: 'admin' as const },
  { id: 'b2', name: 'Garázs Blues', logoData: null, role: 'member' as const },
  { id: 'b3', name: 'Szombati Jam', logoData: null, role: 'member' as const },
];

/** Band switcher with fixture bands (no server calls): menu on desktop, sheet on mobile. */
export function BandSwitcherSection() {
  return (
    <section id="band-switcher" className="flex flex-col gap-4">
      <div className="w-fit rounded-xl border border-border p-2">
        <BandSwitcher preview={{ bands, activeBandId: 'b1' }} />
      </div>
    </section>
  );
}
