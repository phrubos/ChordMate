'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, close]);

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

      {open && mounted && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm animate-in fade-in-0 duration-150"
          onClick={close}
        >
          <div className="relative flex items-center justify-center animate-in zoom-in-90 duration-200">
            <button
              type="button"
              onClick={close}
              className="absolute -right-4 -top-4 sm:-right-6 sm:-top-6 z-10 flex size-9 sm:size-11 items-center justify-center rounded-full bg-background/80 text-foreground/80 hover:text-foreground hover:bg-background border border-border/50 backdrop-blur-md transition-all shadow-md"
              aria-label="Bezárás"
            >
              <X className="size-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="max-h-[85vh] max-w-[85vw] object-contain rounded-xl shadow-2xl block"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
