'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, User, ArrowRight, Loader2, Ticket } from 'lucide-react';
import { createBand, joinBand, startSolo } from '@/actions/bands';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type Step = 'choose' | 'create' | 'join';

export function OnboardingModal({ open }: { open: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('choose');
  const [bandName, setBandName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreateBand() {
    if (!bandName.trim()) return;
    setLoading(true);
    try {
      await createBand(bandName);
      toast.success('Banda létrehozva!');
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message ?? 'Hiba történt');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinBand() {
    if (!inviteCode.trim()) return;
    setLoading(true);
    try {
      const band = await joinBand(inviteCode);
      toast.success(`Csatlakoztál: ${band.name}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message ?? 'Hiba történt');
    } finally {
      setLoading(false);
    }
  }

  async function handleSolo() {
    setLoading(true);
    try {
      await startSolo();
      toast.success('Solo mód aktiválva!');
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message ?? 'Hiba történt');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden border-border/50 gap-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Üdvözlünk a ChordMate-ben!</DialogTitle>

        <div className="px-6 pt-6 pb-2 text-center">
          <h2 className="text-xl font-bold tracking-tight">Üdvözlünk! 🎸</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Hogyan szeretnéd használni a ChordMate-et?
          </p>
        </div>

        <div className="px-6 pb-6 pt-2">
          <AnimatePresence mode="wait">
            {step === 'choose' && (
              <motion.div
                key="choose"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex flex-col gap-3"
              >
                {/* Create band */}
                <button
                  onClick={() => setStep('create')}
                  className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card/50 p-4 text-left transition-all hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <Users className="size-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">Banda létrehozása</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Hozz létre egy bandát és hívd meg a társaidat
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </button>

                {/* Join band */}
                <button
                  onClick={() => setStep('join')}
                  className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card/50 p-4 text-left transition-all hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <Ticket className="size-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">Csatlakozás meghívóval</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Add meg a meghívó kódot egy létező bandához
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </button>

                {/* Solo */}
                <button
                  onClick={handleSolo}
                  disabled={loading}
                  className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card/50 p-4 text-left transition-all hover:border-border hover:bg-secondary/30"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground transition-colors group-hover:bg-secondary">
                    {loading ? <Loader2 className="size-6 animate-spin" /> : <User className="size-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">Solo mód</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Használd egyedül, később is létrehozhatsz bandát
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                </button>
              </motion.div>
            )}

            {step === 'create' && (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                className="flex flex-col gap-4"
              >
                <div>
                  <p className="text-sm font-semibold">Banda neve</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Válassz egy nevet a bandádnak
                  </p>
                </div>
                <Input
                  placeholder="pl. DadStar, Rock Banda..."
                  value={bandName}
                  onChange={(e) => setBandName(e.target.value)}
                  className="h-11 rounded-lg"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && bandName.trim()) handleCreateBand();
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-10 rounded-xl"
                    onClick={() => setStep('choose')}
                    disabled={loading}
                  >
                    Vissza
                  </Button>
                  <Button
                    className="flex-1 h-10 rounded-xl gap-2"
                    onClick={handleCreateBand}
                    disabled={!bandName.trim() || loading}
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <Users className="size-4" />}
                    Létrehozás
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'join' && (
              <motion.div
                key="join"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                className="flex flex-col gap-4"
              >
                <div>
                  <p className="text-sm font-semibold">Meghívó kód</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Kérd el a banda admintól a meghívó kódot
                  </p>
                </div>
                <Input
                  placeholder="pl. A3F1B2C4"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="h-11 rounded-lg font-mono tracking-widest text-center text-lg"
                  autoFocus
                  maxLength={8}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inviteCode.trim()) handleJoinBand();
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-10 rounded-xl"
                    onClick={() => setStep('choose')}
                    disabled={loading}
                  >
                    Vissza
                  </Button>
                  <Button
                    className="flex-1 h-10 rounded-xl gap-2"
                    onClick={handleJoinBand}
                    disabled={!inviteCode.trim() || loading}
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <Ticket className="size-4" />}
                    Csatlakozás
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
