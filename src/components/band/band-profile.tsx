'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Users, Copy, RefreshCw, LogOut, Trash2, Pencil, Check, X, Crown, Shield, Camera, Image as ImageIcon, Eye, Plus, Ticket, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { updateBandName, regenerateInviteCode, removeBandMember, leaveBand, updateBandImages, createBand, joinBand } from '@/actions/bands';
import { toast } from 'sonner';
import type { BandWithMembers } from '@/types';
import { TruncatedText } from '@/components/shared/truncated-text';
import { compressImageBase64 } from '@/lib/image-utils';

interface BandProfileProps {
  band: BandWithMembers;
  currentUserId: string;
  bandCount?: number;
}

export function BandProfile({ band, currentUserId, bandCount = 1 }: BandProfileProps) {
  const router = useRouter();
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(band.name);
  const [inviteCode, setInviteCode] = useState(band.inviteCode);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<'none' | 'create' | 'join'>('none');
  const [newBandName, setNewBandName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const bgInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

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

  async function handleCreateBand() {
    if (!newBandName.trim()) return;
    setAddLoading(true);
    try {
      const result = await createBand(newBandName);
      toast.success(`Banda létrehozva: ${result.name}`);
      setAddMode('none');
      setNewBandName('');
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message ?? 'Hiba történt');
    } finally {
      setAddLoading(false);
    }
  }

  async function handleJoinBand() {
    if (!joinCode.trim()) return;
    setAddLoading(true);
    try {
      const result = await joinBand(joinCode);
      toast.success(`Csatlakoztál: ${result.name}`);
      setAddMode('none');
      setJoinCode('');
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message ?? 'Hiba történt');
    } finally {
      setAddLoading(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const base64 = await compressImageBase64(file, { maxWidth: 800, maxHeight: 800 });
      await updateBandImages(band.id, base64, undefined);
      toast.success('Logó frissítve');
    } catch (err: any) {
      toast.error(err?.message ?? 'Hiba történt a logó feltöltésekor');
    } finally {
      setLoading(false);
    }
  }

  async function handleBackgroundUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const base64 = await compressImageBase64(file, { maxWidth: 1920, maxHeight: 1080 });
      await updateBandImages(band.id, undefined, base64);
      toast.success('Háttérkép frissítve');
    } catch (err: any) {
      toast.error(err?.message ?? 'Hiba történt a háttérkép feltöltésekor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* Band Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8 overflow-hidden rounded-2xl border border-border/50 bg-card/30 shadow-lg"
      >
        <div className="relative h-48 w-full bg-secondary/30">
          {band.backgroundData ? (
            <img src={band.backgroundData} alt="Cover" className="h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-background" />
          )}

          {(isAdmin || band.backgroundData) && (
            <div className="absolute right-4 top-4">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex cursor-pointer items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-colors hover:bg-black/80">
                  <ImageIcon className="size-4" />
                  <span className="hidden sm:inline">Háttér</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {band.backgroundData && (
                    <DropdownMenuItem onClick={() => setViewImage(band.backgroundData!)}>
                      <Eye className="mr-2 size-4" />
                      Megtekintés
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => bgInputRef.current?.click()}>
                      <Camera className="mr-2 size-4" />
                      Új feltöltése
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <input type="file" ref={bgInputRef} accept="image/*" className="hidden" onChange={handleBackgroundUpload} disabled={loading} />
            </div>
          )}
        </div>

        <div className="relative p-6 pt-4">
          <div className="absolute -top-12 left-6">
            <div className="group relative">
              <DropdownMenu>
                <DropdownMenuTrigger className="relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 rounded-full">
                  <Avatar className="size-24 rounded-full border-4 border-background bg-secondary shadow-md transition-opacity hover:opacity-90">
                    {band.logoData ? (
                      <AvatarImage src={band.logoData} alt="Logo" className="object-cover" />
                    ) : (
                      <AvatarFallback className="text-3xl font-bold bg-primary/20 text-primary">
                        {band.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  {(isAdmin || band.logoData) && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                      <Camera className="mb-1 size-6 text-white" />
                      <span className="text-[10px] font-medium text-white">{band.logoData ? 'Kezelés' : 'Új logó'}</span>
                    </div>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {band.logoData && (
                    <DropdownMenuItem onClick={() => setViewImage(band.logoData!)}>
                      <Eye className="mr-2 size-4" />
                      Megtekintés
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => logoInputRef.current?.click()}>
                      <Camera className="mr-2 size-4" />
                      Új feltöltése
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <input type="file" ref={logoInputRef} accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={loading} />
            </div>
          </div>
          
          <div className="h-14" /> {/* Spacer to respect negative margin of avatar */}

          <div className="flex flex-col">
            {isEditingName ? (
              <div className="flex max-w-[300px] items-center gap-2 mt-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-10 text-base font-semibold"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') {
                      setIsEditingName(false);
                      setNewName(band.name);
                    }
                  }}
                />
                <Button variant="ghost" size="icon" className="size-10 shrink-0 text-primary" onClick={handleSaveName} disabled={loading}>
                  <Check className="size-5" />
                </Button>
                <Button variant="ghost" size="icon" className="size-10 shrink-0" onClick={() => { setIsEditingName(false); setNewName(band.name); }}>
                  <X className="size-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 mt-2">
                <h1 className="text-2xl font-bold tracking-tight">{band.name}</h1>
                {isAdmin && (
                  <Button variant="outline" size="icon" className="size-8 rounded-full shadow-sm" onClick={() => setIsEditingName(true)}>
                    <Pencil className="size-3.5" />
                  </Button>
                )}
              </div>
            )}
            <p className="mt-1.5 text-sm text-muted-foreground">
              {band.members.length} tag {isSolo && ' • Solo mód – hívj meg másokat!'}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="mt-2 flex flex-col gap-5">

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

        {/* Add new band / Join */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-border/50 bg-card/50 p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">Új banda</p>

          {addMode === 'none' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-10 rounded-xl gap-2"
                onClick={() => setAddMode('create')}
              >
                <Plus className="size-4" />
                Létrehozás
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-10 rounded-xl gap-2"
                onClick={() => setAddMode('join')}
              >
                <Ticket className="size-4" />
                Csatlakozás
              </Button>
            </div>
          )}

          {addMode === 'create' && (
            <div className="flex flex-col gap-3">
              <Input
                placeholder="Banda neve..."
                value={newBandName}
                onChange={(e) => setNewBandName(e.target.value)}
                className="h-10 rounded-lg"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newBandName.trim()) handleCreateBand();
                  if (e.key === 'Escape') { setAddMode('none'); setNewBandName(''); }
                }}
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-9 rounded-xl" onClick={() => { setAddMode('none'); setNewBandName(''); }} disabled={addLoading}>
                  Mégse
                </Button>
                <Button className="flex-1 h-9 rounded-xl gap-2" onClick={handleCreateBand} disabled={!newBandName.trim() || addLoading}>
                  {addLoading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  Létrehozás
                </Button>
              </div>
            </div>
          )}

          {addMode === 'join' && (
            <div className="flex flex-col gap-3">
              <Input
                placeholder="Meghívó kód (pl. A3F1B2C4)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="h-10 rounded-lg font-mono tracking-widest text-center"
                autoFocus
                maxLength={8}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && joinCode.trim()) handleJoinBand();
                  if (e.key === 'Escape') { setAddMode('none'); setJoinCode(''); }
                }}
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-9 rounded-xl" onClick={() => { setAddMode('none'); setJoinCode(''); }} disabled={addLoading}>
                  Mégse
                </Button>
                <Button className="flex-1 h-9 rounded-xl gap-2" onClick={handleJoinBand} disabled={!joinCode.trim() || addLoading}>
                  {addLoading ? <Loader2 className="size-4 animate-spin" /> : <Ticket className="size-4" />}
                  Csatlakozás
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Leave band */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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

      {/* Fullscreen Image Viewer */}
      {viewImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm animate-in fade-in-0 duration-150"
          onClick={() => setViewImage(null)}
        >
          <div className="relative flex items-center justify-center animate-in zoom-in-90 duration-200">
            <button
              onClick={() => setViewImage(null)}
              className="absolute -right-4 -top-4 sm:-right-6 sm:-top-6 z-10 flex size-9 sm:size-11 items-center justify-center rounded-full bg-background/80 text-foreground/80 hover:text-foreground hover:bg-background border border-border/50 backdrop-blur-md transition-all shadow-md cursor-pointer"
            >
              <X className="size-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={viewImage}
              alt="Nagyított megtekintés"
              className="max-h-[85vh] max-w-[85vw] object-contain rounded-xl shadow-2xl block"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
