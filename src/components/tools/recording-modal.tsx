'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as AlertTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/design/eyebrow';
import { Input } from '@/components/ui/input';
import { Mic, Square, Play, Pause, Trash2, Pencil, Check, X, Save, Loader2 } from 'lucide-react';
import { PlayerProvider, usePlayer, usePlayerOptional } from '@/components/player/player-provider';
import { ElapsedTime, SeekBar, TotalTime } from '@/components/player/seek-bar';
import { formatClock, recordingSubtitle, recordingTrack } from '@/lib/player-state';
import {
  saveRecording as dbSave,
  getRecordingsByDate,
  updateRecordingName,
  deleteRecording,
} from '@/actions/recordings';
import type { RecordingMeta } from '@/types';
import { toast } from 'sonner';
import { ExpandableText } from '@/components/shared/expandable-text';
import { cn } from '@/lib/utils';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // strip data:...;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ─── SVG Turntable ─────────────────────────────────────────────
/**
 * Static record disc (no decorative motion, spec §6). While recording, the label row turns into the timer,
 * so the modal keeps its height between idle and recording (A18).
 */
function RecorderDisc({ recording, label, elapsed }: { recording: boolean; label: string; elapsed?: number }) {
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div aria-hidden className="relative grid size-36 place-items-center rounded-full bg-foreground/[0.06] shadow-[inset_0_0_0_1px_var(--border-strong)]">
        {[0.82, 0.66, 0.5].map((f) => (
          <span key={f} className="absolute rounded-full shadow-[inset_0_0_0_1px_var(--border)]" style={{ width: `${f * 100}%`, height: `${f * 100}%` }} />
        ))}
        <span className={cn('grid size-12 place-items-center rounded-full transition-colors', recording ? 'bg-destructive' : 'bg-primary')}>
          <span className="size-1.5 rounded-full bg-background" />
        </span>
      </div>
      <div className="grid h-9 place-items-center">
        {recording && elapsed !== undefined ? (
          <span
            key="timer"
            role="timer"
            aria-label={`${label}: ${formatClock(elapsed)}`}
            className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-1.5 animate-in fade-in-0 duration-(--dur-fade)"
          >
            <span className="size-2 rounded-full bg-destructive" />
            <span className="text-lg leading-6 font-bold tabular-nums text-destructive">{formatClock(elapsed)}</span>
          </span>
        ) : (
          <span key="label" className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase animate-in fade-in-0 duration-(--dur-fade)">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Recordings List ───────────────────────────────────────────
/**
 * A22: recordings play in the shared player — the mini player on app pages (it keeps playing after the
 * modal closes), or the modal's own provider in Próba mód. The playing row shows the seek bar (A21).
 */
export function RecordingsList({
  recordings,
  onUpdate,
}: {
  recordings: RecordingMeta[];
  onUpdate: () => void;
}) {
  const player = usePlayer();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const queue = recordings.map((r) => recordingTrack(r, recordingSubtitle(r.date)));

  function togglePlay(index: number) {
    const track = queue[index];
    if (player.current?.id === track.id) player.toggle();
    else player.playTrack(track, queue);
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return;
    try {
      await updateRecordingName(id, editName.trim());
      setEditingId(null);
      onUpdate();
    } catch {
      toast.error('Hiba a név módosításakor');
    }
  }

  async function confirmDelete() {
    if (deleteConfirmId == null) return;
    if (player.current?.id === `rec:${deleteConfirmId}`) player.close();
    try {
      await deleteRecording(deleteConfirmId);
      toast.success('Felvétel törölve');
      onUpdate();
    } catch {
      toast.error('Hiba a törlésnél');
    } finally {
      setDeleteConfirmId(null);
    }
  }

  return (
    <div className="w-full flex flex-col gap-1.5">
      <p className="px-1 font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase">
        Felvételek ({recordings.length})
      </p>
      <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
        {recordings.map((rec, index) => {
          const isCurrent = player.current?.id === queue[index].id;
          const isPlaying = isCurrent && player.state.isPlaying;
          const isLoading = isCurrent && player.loading && player.state.isPlaying;
          const isEditing = editingId === rec.id;

          return (
            <div
              key={rec.id}
              className={cn('group relative rounded-lg px-2 py-2 transition-colors', isCurrent ? 'bg-primary/[0.07]' : 'hover:bg-secondary/30')}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => togglePlay(index)}
                  aria-label={isPlaying ? `Szünet: ${rec.name}` : `Lejátszás: ${rec.name}`}
                  aria-busy={isLoading || undefined}
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full transition-[color,background-color,transform] active:scale-[.97]',
                    isCurrent ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'bg-primary/10 text-primary hover:bg-primary/20'
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" />
                  ) : isPlaying ? (
                    <Pause className="size-3.5 fill-current" />
                  ) : (
                    <Play className="size-3.5 ml-0.5 fill-current" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-7 text-xs"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(rec.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                      <Button variant="ghost" size="icon-xs" aria-label="Név mentése" onClick={() => handleRename(rec.id)}>
                        <Check className="size-3" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" aria-label="Mégse" onClick={() => setEditingId(null)}>
                        <X className="size-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className={cn('text-sm font-medium leading-tight', isCurrent && 'text-primary-text')}>
                        <ExpandableText className="block" clampClassName="truncate">{rec.name}</ExpandableText>
                      </p>
                      {!isCurrent && <p className="text-[11px] text-muted-foreground tabular-nums">{formatClock(rec.duration)}</p>}
                    </>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex items-center gap-0.5 shrink-0 opacity-100 transition-opacity hover-device:opacity-0 hover-device:group-hover:opacity-100 hover-device:group-focus-within:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Átnevezés: ${rec.name}`}
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setEditingId(rec.id);
                        setEditName(rec.name);
                      }}
                    >
                      <Pencil className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Törlés: ${rec.name}`}
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteConfirmId(rec.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                )}
              </div>

              {isCurrent && !isEditing && (
                <div className="mt-1 ml-11 flex items-center gap-2.5 font-mono text-[11px] text-muted-foreground animate-in fade-in-0 duration-(--dur-fade)">
                  <ElapsedTime className="w-9 shrink-0" />
                  <SeekBar label={`Lejátszási pozíció: ${rec.name}`} className="h-6 flex-1" />
                  <TotalTime className="w-9 shrink-0 text-right" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteConfirmId != null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertTitle>Felvétel törlése</AlertTitle>
            <AlertDialogDescription>
              Biztosan törölni szeretnéd ezt a felvételt? Ez a művelet nem vonható vissza.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Törlés
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Main Modal ────────────────────────────────────────────────
/** A18: the new state's controls fade in (the old ones leave instantly — no overlap, no height animation). */
const STATE_ENTER = 'animate-in fade-in-0 duration-(--dur-fade) ease-(--ease-out)';

type RecState = 'idle' | 'recording' | 'naming';

interface RecordingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  /** Set from Próba mode: the recording is linked to this song. */
  songId?: string;
  readOnly?: boolean;
}

export function RecordingModal({ open, onOpenChange, date, songId, readOnly = false }: RecordingModalProps) {
  const sharedPlayer = usePlayerOptional();
  const [state, setState] = useState<RecState>('idle');
  const [recordings, setRecordings] = useState<RecordingMeta[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingName, setRecordingName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const loadRecordings = useCallback(async () => {
    try {
      const recs = await getRecordingsByDate(date);
      setRecordings(recs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch {
      // IndexedDB not available
    }
  }, [date]);

  useEffect(() => {
    if (open) loadRecordings();
  }, [open, loadRecordings]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setRecordedBlob(blob);
        setState('naming');
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // collect data every second
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
      setState('recording');
    } catch {
      toast.error('Mikrofon hozzáférés megtagadva');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function handleSave() {
    if (!recordedBlob || !recordingName.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const audioBase64 = await blobToBase64(recordedBlob);
      await dbSave({
        date,
        name: recordingName.trim(),
        audioBase64,
        mimeType: recordedBlob.type,
        duration: elapsed,
        songId,
      });
      toast.success('Felvétel mentve');
      setRecordedBlob(null);
      setRecordingName('');
      setState('idle');
      setElapsed(0);
      loadRecordings();
    } catch {
      toast.error('Hiba a mentésnél');
    } finally {
      setIsSaving(false);
    }
  }

  function handleDiscard() {
    setRecordedBlob(null);
    setRecordingName('');
    setState('idle');
    setElapsed(0);
  }

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      setState('idle');
      setElapsed(0);
      setRecordedBlob(null);
      setRecordingName('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden border-border/50 gap-0 max-h-[90vh]">
        <DialogTitle className="sr-only">Hangfelvétel</DialogTitle>

        <div className="flex flex-col px-5 pt-5 pb-4 gap-4 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <Eyebrow>{readOnly ? 'Korábbi próbafelvételek' : 'Próba rögzítése'}</Eyebrow>
            <h2 className="display-soft font-display text-[26px] leading-tight font-medium">{readOnly ? 'Felvételek' : 'Hangfelvétel'}</h2>
          </div>

          {/* Visual: Radio for readOnly, Turntable for recording */}
          <RecorderDisc
            recording={!readOnly && state === 'recording'}
            label={readOnly ? `${recordings.length} felvétel` : state === 'recording' ? 'Felvétel folyamatban' : 'Kész a felvételre'}
            elapsed={elapsed}
          />

          {/* Controls — only when not readOnly */}
          {!readOnly && (
            <>
              {state === 'idle' && (
                <div key="idle" className={STATE_ENTER}>
                  <Button
                    size="lg"
                    className="w-full h-12 rounded-xl gap-2 text-sm font-semibold bg-destructive text-background hover:bg-destructive/90"
                    onClick={startRecording}
                  >
                    <Mic className="size-4" />
                    Felvétel indítása
                  </Button>
                </div>
              )}

              {state === 'recording' && (
                <div key="recording" className={STATE_ENTER}>
                  <Button
                    size="lg"
                    className="w-full h-12 rounded-xl gap-2 text-sm font-semibold bg-destructive text-background hover:bg-destructive/90"
                    onClick={stopRecording}
                  >
                    <Square className="size-4 fill-current" />
                    Leállítás
                  </Button>
                </div>
              )}

              {state === 'naming' && (
                <div key="naming" className={cn('flex flex-col gap-3', STATE_ENTER, 'slide-in-from-bottom-1')}>
                  <div className="text-center">
                    <p className="text-sm font-medium">Felvétel kész!</p>
                    <p className="text-xs text-muted-foreground">Időtartam: {formatClock(elapsed)}</p>
                  </div>
                  <Input
                    placeholder="Add meg a felvétel nevét..."
                    value={recordingName}
                    onChange={(e) => setRecordingName(e.target.value)}
                    className="h-10 rounded-lg"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && recordingName.trim()) handleSave();
                    }}
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 h-10 rounded-xl" onClick={handleDiscard}>
                      Elvetés
                    </Button>
                    <Button
                      className="flex-1 h-10 rounded-xl gap-2"
                      onClick={handleSave}
                      disabled={!recordingName.trim()}
                      isLoading={isSaving}
                    >
                      <Save className="size-4" />
                      Mentés
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Recordings list — Próba mód has no shared player, so the list brings one that stops with the modal. */}
          {recordings.length > 0 && (
            <div className="border-t border-border/30 pt-4">
              {sharedPlayer ? (
                <RecordingsList recordings={recordings} onUpdate={loadRecordings} />
              ) : (
                <PlayerProvider>
                  <RecordingsList recordings={recordings} onUpdate={loadRecordings} />
                </PlayerProvider>
              )}
            </div>
          )}

          {/* Empty state for readOnly when no recordings */}
          {readOnly && recordings.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Nincsenek felvételek ezen a napon</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
