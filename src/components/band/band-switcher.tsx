'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Users, ChevronDown, Check, Plus, Settings, Image as ImageIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { ImageLightbox } from '@/components/shared/image-lightbox';
import { PendingLink } from '@/components/shared/pending-link';
import { getUserBands, getUserBandId, setActiveBand } from '@/actions/bands';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BandInfo {
  id: string;
  name: string;
  logoData: string | null;
  role: 'admin' | 'member';
}

function BandLogo({ band, size }: { band: BandInfo | undefined; size: 28 | 32 }) {
  return (
    <span className={cn('flex shrink-0 items-center justify-center overflow-hidden bg-primary/10 ring-1 ring-border/50', size === 32 ? 'size-8 rounded-lg' : 'size-7 rounded-md')}>
      {band?.logoData ? (
        <Image src={band.logoData} alt="" width={size} height={size} className="size-full object-cover" />
      ) : (
        <Users className={cn('text-primary', size === 32 ? 'size-4' : 'size-3.5')} />
      )}
    </span>
  );
}

const roleLabel = (role: BandInfo['role']) => (role === 'admin' ? 'Admin' : 'Tag');

/**
 * The active band, and switching between bands. Desktop: a menu whose bands are radio items; mobile: a sheet
 * with a radio list. Profile, logo and "new band" are their own items — nothing is nested inside a band row.
 */
export function BandSwitcher({ preview }: { preview?: { bands: BandInfo[]; activeBandId: string } } = {}) {
  const router = useRouter();
  const [bands, setBands] = useState<BandInfo[]>(preview?.bands ?? []);
  const [activeBandId, setActiveBandId] = useState<string | null>(preview?.activeBandId ?? null);
  const [loading, setLoading] = useState(!preview);
  const [logoOpen, setLogoOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (preview) return;
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
  }, [preview]);

  const activeBand = bands.find(b => b.id === activeBandId);

  async function handleSwitch(bandId: string) {
    if (bandId === activeBandId) return;
    try {
      if (!preview) await setActiveBand(bandId);
      setActiveBandId(bandId);
      toast.success(`Váltás: ${bands.find(b => b.id === bandId)?.name}`);
      setMobileOpen(false);
      if (!preview) router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hiba történt');
    }
  }

  if (loading || bands.length === 0) return null;

  const triggerLabel = `Banda: ${activeBand?.name ?? 'nincs kiválasztva'}${bands.length > 1 ? ' — váltás' : ''}`;
  const triggerContent = (
    <>
      <BandLogo band={activeBand} size={32} />
      <span className="hidden sm:flex flex-col items-start min-w-0">
        <span className="text-xs leading-none text-muted-foreground/50 font-medium">Banda</span>
        <span className="text-xs font-semibold truncate max-w-[100px]">
          {activeBand?.name ?? 'Nincs banda'}
        </span>
      </span>
      {bands.length > 1 && <ChevronDown className="size-3 text-muted-foreground/50 shrink-0" />}
    </>
  );

  const rowClass = 'pressable flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-[transform,background-color] duration-(--dur-fade) outline-none hover:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-ring [--press-scale:.985]';

  return (
    <>
      {/* Desktop: dropdown menu */}
      <div className="hidden md:block">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={triggerLabel}
            render={
              <Button
                variant="ghost"
                className="gap-2 rounded-xl px-2 py-1.5 h-auto hover:bg-secondary/50"
              />
            }
          >
            {triggerContent}
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="min-w-[220px]">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Bandáid</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={activeBandId ?? ''} onValueChange={(id: string) => handleSwitch(id)}>
                {bands.map(band => (
                  <DropdownMenuRadioItem key={band.id} value={band.id} closeOnClick className="gap-3 py-1.5">
                    <BandLogo band={band} size={28} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{band.name}</span>
                      <span className="text-xs text-muted-foreground">{roleLabel(band.role)}</span>
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/band')} className="gap-3">
              <Settings />
              Banda profil
            </DropdownMenuItem>
            {activeBand?.logoData && (
              <DropdownMenuItem onClick={() => setLogoOpen(true)} className="gap-3">
                <ImageIcon />
                Logó megtekintése
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => router.push('/band')} className="gap-3 text-muted-foreground">
              <Plus />
              Új banda / Csatlakozás
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile: button that opens a sheet */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          aria-label={triggerLabel}
          aria-haspopup="dialog"
          className="gap-2 rounded-xl px-2 py-1.5 h-auto hover:bg-secondary/50"
          onClick={() => setMobileOpen(true)}
        >
          {triggerContent}
        </Button>
      </div>

      {/* Mobile: bottom sheet (A2) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent>
          <SheetTitle>Bandáid</SheetTitle>
          <div className="-mx-2 flex flex-col">
            <div role="radiogroup" aria-label="Aktív banda" className="flex flex-col">
              {bands.map(band => {
                const active = band.id === activeBandId;
                return (
                  <button key={band.id} type="button" role="radio" aria-checked={active} onClick={() => handleSwitch(band.id)} className={rowClass}>
                    <BandLogo band={band} size={28} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={cn('truncate', active && 'font-semibold')}>{band.name}</span>
                      <span className="text-xs text-muted-foreground">{roleLabel(band.role)}</span>
                    </span>
                    {active && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
                  </button>
                );
              })}
            </div>
            <div className="my-1 h-px bg-border/50" />
            <PendingLink href="/band" onClick={() => setMobileOpen(false)} className={rowClass}>
              <span className="flex size-7 shrink-0 items-center justify-center text-muted-foreground"><Settings className="size-4" /></span>
              Banda profil
            </PendingLink>
            {activeBand?.logoData && (
              <button type="button" onClick={() => { setMobileOpen(false); setLogoOpen(true); }} className={rowClass}>
                <span className="flex size-7 shrink-0 items-center justify-center text-muted-foreground"><ImageIcon className="size-4" /></span>
                Logó megtekintése
              </button>
            )}
            <PendingLink href="/band" onClick={() => setMobileOpen(false)} className={cn(rowClass, 'text-muted-foreground')}>
              <span className="flex size-7 shrink-0 items-center justify-center"><Plus className="size-4" /></span>
              Új banda / Csatlakozás
            </PendingLink>
          </div>
        </SheetContent>
      </Sheet>

      <ImageLightbox src={logoOpen ? activeBand?.logoData ?? null : null} alt={`${activeBand?.name ?? 'Banda'} logója`} onClose={() => setLogoOpen(false)} />
    </>
  );
}
