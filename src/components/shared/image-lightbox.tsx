'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';

/**
 * A picture enlarged over the page. A real dialog: Esc, the backdrop and the × close it, focus stays inside
 * and returns to whatever opened it.
 */
export function ImageLightbox({ src, alt, onClose }: { src: string | null; alt: string; onClose: () => void }) {
  // Keep the last picture through the exit animation.
  const [shown, setShown] = useState(src);
  if (src && src !== shown) setShown(src);

  return (
    <Dialog open={!!src} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="w-[min(85vw,40rem)] max-w-none bg-transparent p-0 ring-0 sm:max-w-none">
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        {shown && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt={alt} className="block h-auto max-h-[85vh] w-full rounded-xl object-contain shadow-2xl" />
        )}
        <DialogClose
          render={<Button variant="secondary" size="icon" className="absolute -top-4 -right-4 border border-border-strong shadow-md sm:-top-5 sm:-right-5" />}
        >
          <X />
          <span className="sr-only">Bezárás</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
