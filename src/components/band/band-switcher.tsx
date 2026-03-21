'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Users, ChevronDown, Check, Plus, Settings, X, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { getUserBands, getUserBandId, setActiveBand } from '@/actions/bands';
import { toast } from 'sonner';

interface BandInfo {
  id: string;
  name: string;
  logoData: string | null;
  role: 'admin' | 'member';
}

export function BandSwitcher() {
  const router = useRouter();
  const [bands, setBands] = useState<BandInfo[]>([]);
  const [activeBandId, setActiveBandId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [allBands, currentId] = await Promise.all([
          getUserBands(),
          getUserBandId(),
        ]);
        setBands(allBands);
        setActiveBandId(currentId);
      } catch {
        // Not logged in or error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeBand = bands.find(b => b.id === activeBandId);

  async function handleSwitch(bandId: string) {
    if (bandId === activeBandId) return;
    try {
      await setActiveBand(bandId);
      setActiveBandId(bandId);
      toast.success(`Váltás: ${bands.find(b => b.id === bandId)?.name}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message ?? 'Hiba történt');
    }
  }

  if (loading || bands.length === 0) return null;

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="gap-2 rounded-xl px-2 py-1.5 h-auto hover:bg-secondary/50"
          />
        }
      >
        {/* Band logo */}
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-primary/10 ring-1 ring-border/50"
          onClick={(e) => {
            if (activeBand?.logoData) {
              e.preventDefault();
              e.stopPropagation();
              setLightboxSrc(activeBand.logoData);
            }
          }}
        >
          {activeBand?.logoData ? (
            <Image
              src={activeBand.logoData}
              alt={activeBand.name}
              width={32}
              height={32}
              className="size-full object-cover"
            />
          ) : (
            <Users className="size-4 text-primary" />
          )}
        </div>
        {/* Band name */}
        <div className="hidden sm:flex flex-col items-start min-w-0">
          <span className="text-[11px] leading-none text-muted-foreground/50 font-medium">Banda</span>
          <span className="text-xs font-semibold truncate max-w-[100px]">
            {activeBand?.name ?? 'Nincs banda'}
          </span>
        </div>
        {bands.length > 1 && <ChevronDown className="size-3 text-muted-foreground/50 shrink-0" />}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[200px]">
        {bands.map(band => (
          <DropdownMenuItem
            key={band.id}
            onClick={() => handleSwitch(band.id)}
            className="gap-3"
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md overflow-hidden bg-primary/10 ring-1 ring-border/30">
              {band.logoData ? (
                <Image src={band.logoData} alt={band.name} width={28} height={28} className="size-full object-cover" />
              ) : (
                <Users className="size-3.5 text-primary" />
              )}
            </div>
            <span className="flex-1 truncate text-sm">{band.name}</span>
            {band.id === activeBandId && (
              <Check className="size-4 text-primary shrink-0" />
            )}
            {band.logoData && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxSrc(band.logoData);
                }}
                title="Logó megtekintése"
                className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <Eye className="size-3.5" />
              </div>
            )}
            {band.id === activeBandId && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/band');
                }}
                title="Banda profil"
                className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <Settings className="size-3.5" />
              </div>
            )}
          </DropdownMenuItem>
        ))}

        {/* Separator + actions */}
        <div className="h-px bg-border/50 my-1" />
        <DropdownMenuItem onClick={() => router.push('/band')} className="gap-3 text-muted-foreground">
          <div className="flex size-7 shrink-0 items-center justify-center">
            <Plus className="size-4" />
          </div>
          <span className="text-sm">Új banda / Csatlakozás</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    {/* Lightbox for band logo — portalled to body to escape navbar's backdrop-blur containing block */}
    {lightboxSrc && createPortal(
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={() => setLightboxSrc(null)}
      >
        <div className="relative flex items-center justify-center animate-in zoom-in-90 duration-200">
          <button
            onClick={() => setLightboxSrc(null)}
            className="absolute -right-4 -top-4 sm:-right-6 sm:-top-6 z-10 flex size-9 sm:size-11 items-center justify-center rounded-full bg-background/80 text-foreground/80 hover:text-foreground hover:bg-background border border-border/50 backdrop-blur-md transition-all shadow-md cursor-pointer"
          >
            <X className="size-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc}
            alt={bands.find(b => b.logoData === lightboxSrc)?.name ?? 'Banda logó'}
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
