'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface ImageLightboxProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export function ImageLightbox({ src, alt, width, height, className }: ImageLightboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-zoom-in overflow-hidden"
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={className}
          unoptimized
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in-0 duration-150"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="size-5" />
          </button>
          <div
            className="relative max-h-[85vh] max-w-[85vw] overflow-hidden rounded-xl shadow-2xl animate-in zoom-in-90 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={src}
              alt={alt}
              width={600}
              height={600}
              className="size-auto max-h-[85vh] max-w-[85vw] object-contain"
              unoptimized
            />
          </div>
        </div>
      )}
    </>
  );
}
