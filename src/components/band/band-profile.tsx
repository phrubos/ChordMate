'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Users, Copy, RefreshCw, LogOut, Trash2, Pencil, Check, X, Crown, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { updateBandName, regenerateInviteCode, removeBandMember, leaveBand } from '@/actions/bands';
import { toast } from 'sonner';
import type { BandWithMembers } from '@/types';
import { TruncatedText } from '@/components/shared/truncated-text';
import { PageHeader } from '@/components/shared/page-header';

interface BandProfileProps {
  band: BandWithMembers;
  currentUserId: string;
}

export function BandProfile({ band, currentUserId }: BandProfileProps) {
  const router = useRouter();
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(band.name);
  const [inviteCode, setInviteCode] = useState(band.inviteCode);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const myRole = band.members.find(m => m.userId === currentUserId)?.role;
  const isAdmin = myRole === 'admin';
  const isSolo = band.members.length === 1 && band.name.endsWith('– Solo');

  async function handleSaveName() {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await updateBandName(newName);
      setIsEditingName(false);
      toast.success('Banda neve frissítve');
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message ?? 'Hiba történt');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerateCode() {
    setLoading(true);
    try {
      const newCode = await regenerateInviteCode();
      setInviteCode(newCode);
      toast.success('Új meghívó kód generálva');
    } catch (err: any) {
      toast.error(err?.message ?? 'Hiba történt');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyCode() {
    await navigator.clipboard.writeText(inviteCode);
    toast.success('Meghívó kód másolva!');
  }

  async function handleRemoveMember() {
    if (!confirmRemove) return;
    setLoading(true);
    try {
      await removeBandMember(confirmRemove);
      toast.success('Tag eltávolítva');
      setConfirmRemove(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message ?? 'Hiba történt');
    } finally {
      setLoading(false);
    }
  }

  async function handleLeaveBand() {
    setLoading(true);
    try {
      await leaveBand();
      toast.success('Kiléptél a bandából');
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message ?? 'Hiba történt');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Banda profil" description={isSolo ? 'Solo mód – hívj meg másokat!' : 'A bandád beállításai'} />

      <div className="mt-6 flex flex-col gap-5">
        {/* Band name */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border/50 bg-card/50 p-5"
        >
          <div className="flex items-center justify-between gap-3">
            {isEditingName ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-9 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                />
                <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={handleSaveName} disabled={loading}>
                  <Check className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => { setIsEditingName(false); setNewName(band.name); }}>
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Users className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <TruncatedText as="h3" className="text-lg font-semibold">{band.name}</TruncatedText>
                    <p className="text-xs text-muted-foreground">{band.members.length} tag</p>
                  </div>
                </div>
                {isAdmin && (
                  <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => setIsEditingName(true)}>
                    <Pencil className="size-3.5" />
                  </Button>
                )}
              </>
            )}
          </div>
        </motion.div>

        {/* Invite code */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-border/50 bg-card/50 p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">Meghívó kód</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center justify-center rounded-lg bg-background/60 border border-border/50 py-2.5 px-4">
              <span className="font-mono text-lg font-bold tracking-[0.25em] text-primary">{inviteCode}</span>
            </div>
            <Button variant="outline" size="icon" className="size-10 shrink-0" onClick={handleCopyCode} title="Másolás">
              <Copy className="size-4" />
            </Button>
            {isAdmin && (
              <Button variant="outline" size="icon" className="size-10 shrink-0" onClick={handleRegenerateCode} disabled={loading} title="Új kód">
                <RefreshCw className="size-4" />
              </Button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground/50 mt-2 text-center">
            Oszd meg ezt a kódot, hogy mások is csatlakozhassanak
          </p>
        </motion.div>

        {/* Members */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border/50 bg-card/50 p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">Tagok</p>
          <div className="flex flex-col gap-2">
            {band.members
              .sort((a, b) => (a.role === 'admin' ? -1 : 1))
              .map((member) => {
                const initials = member.user.name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase() ?? '?';
                const isMe = member.userId === currentUserId;

                return (
                  <div
                    key={member.userId}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-secondary/20 transition-colors"
                  >
                    <Avatar className="size-9 ring-1 ring-border/50">
                      <AvatarImage src={member.user.image ?? undefined} alt={member.user.name ?? ''} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <TruncatedText as="p" className="text-sm font-medium">{member.user.name ?? 'Ismeretlen'}</TruncatedText>
                        {isMe && <span className="text-[10px] text-muted-foreground/50">(te)</span>}
                      </div>
                      <TruncatedText as="p" className="text-xs text-muted-foreground/60">{member.user.email ?? ''}</TruncatedText>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {member.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          <Crown className="size-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          <Shield className="size-3" />
                          Tag
                        </span>
                      )}
                      {isAdmin && !isMe && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground/50 hover:text-destructive"
                          onClick={() => setConfirmRemove(member.userId)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </motion.div>

        {/* Leave band */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Button
            variant="outline"
            className="w-full h-11 rounded-xl gap-2 text-destructive/70 hover:text-destructive hover:border-destructive/30"
            onClick={() => setConfirmLeave(true)}
          >
            <LogOut className="size-4" />
            {band.members.length === 1 ? 'Banda törlése' : 'Kilépés a bandából'}
          </Button>
        </motion.div>
      </div>

      {/* Confirm leave dialog */}
      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {band.members.length === 1 ? 'Banda törlése' : 'Kilépés a bandából'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {band.members.length === 1
                ? 'Ha törlöd a bandát, az összes megosztott adat elvész. Biztosan folytatod?'
                : 'Biztosan ki szeretnél lépni a bandából?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleLeaveBand}
            >
              {band.members.length === 1 ? 'Törlés' : 'Kilépés'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm remove member dialog */}
      <AlertDialog open={confirmRemove != null} onOpenChange={(open) => !open && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tag eltávolítása</AlertDialogTitle>
            <AlertDialogDescription>
              Biztosan eltávolítod ezt a tagot a bandából?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRemoveMember}
            >
              Eltávolítás
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
