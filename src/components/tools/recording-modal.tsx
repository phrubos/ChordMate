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
import {
  saveRecording as dbSave,
  getRecordingsByDate,
  getRecordingAudio,
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

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds) % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
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
            aria-label={`${label}: ${formatTime(elapsed)}`}
            className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-1.5 animate-in fade-in-0 duration-(--dur-fade)"
          >
            <span className="size-2 rounded-full bg-destructive" />
            <span className="text-lg leading-6 font-bold tabular-nums text-destructive">{formatTime(elapsed)}</span>
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

function SeekableProgress({
  progress,
  duration,
  currentTime,
  onSeek,
}: {
  progress: number;
  duration: number;
  currentTime: number;
  onSeek: (fraction: number) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverX, setHoverX] = useState<number | null>(null);

  function getFraction(clientX: number) {
    if (!barRef.current) return 0;
    const rect = barRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }

  function handlePointerDown(e: React.PointerEvent) {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    onSeek(getFraction(e.clientX));
  }

  function handlePointerMove(e: React.PointerEvent) {
    const frac = getFraction(e.clientX);
    setHoverX(frac);
    if (isDragging) onSeek(frac);
  }

  function handlePointerUp() {
    setIsDragging(false);
  }

  const pct = `${(progress * 100).toFixed(2)}%`;

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-[10px] text-muted-foreground/60 tabular-nums w-8 text-right shrink-0">
        {formatTime(currentTime)}
      </span>
      <div
        ref={barRef}
        className="relative flex-1 h-4 flex items-center cursor-pointer group touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => { setHoverX(null); if (isDragging) setIsDragging(false); }}
      >
        {/* Track background */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 bg-secondary/80 rounded-full" />
        {/* Filled track */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 bg-primary rounded-full"
          style={{ width: pct }}
        />
        {/* Thumb — always visible */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-3.5 rounded-full bg-primary shadow-md ring-2 ring-background pointer-events-none"
          style={{ left: pct }}
        />
        {/* Hover time tooltip */}
        {hoverX !== null && duration > 0 && (
          <div
            className="absolute -top-6 -translate-x-1/2 rounded bg-popover px-1.5 py-0.5 text-[9px] text-popover-foreground shadow-sm pointer-events-none"
            style={{ left: `${hoverX * 100}%` }}
          >
            {formatTime(hoverX * duration)}
          </div>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground/60 tabular-nums w-8 shrink-0">
        {formatTime(duration)}
      </span>
    </div>
  );
}

// ─── Recordings List ───────────────────────────────────────────
function RecordingsList({
  recordings,
  onUpdate,
}: {
  recordings: RecordingMeta[];
  onUpdate: () => void;
}) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const rafRef = useRef<number>(0);
  const knownDurRef = useRef<number>(0);

  function startTick() {
    function tick() {
      if (!audioRef.current || audioRef.current.paused) return;
      const ct = audioRef.current.currentTime;
      const dur = isFinite(audioRef.current.duration) ? audioRef.current.duration : knownDurRef.current;
      setCurrentTime(ct);
      setProgress(dur > 0 ? Math.min(ct / dur, 1) : 0);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  const stopAudio = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    audioRef.current = null;
    setPlayingId(null);
    setIsPaused(false);
    setProgress(0);
    setCurrentTime(0);
    setAudioDuration(0);
  }, []);

  useEffect(() => {
    return () => stopAudio();
  }, [stopAudio]);

  async function togglePlay(rec: RecordingMeta) {
    // If already loading this recording, ignore repeated clicks
    if (loadingId === rec.id) return;

    if (playingId === rec.id) {
      if (!audioRef.current) return;
      if (isPaused) {
        audioRef.current.play();
        setIsPaused(false);
        startTick();
      } else {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        audioRef.current.pause();
        setIsPaused(true);
      }
      return;
    }

    stopAudio();
    setLoadingId(rec.id);

    try {
      const { audioData, mimeType } = await getRecordingAudio(rec.id);

      // If user clicked something else while we were fetching, bail out
      if (loadingId !== null && loadingId !== rec.id) {
        setLoadingId(null);
        return;
      }

      const binary = atob(audioData);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const audio = new Audio();
      audio.preload = 'auto';
      audioRef.current = audio;
      knownDurRef.current = rec.duration;
      setAudioDuration(rec.duration);

      audio.addEventListener('durationchange', () => {
        if (audio.duration && isFinite(audio.duration)) {
          knownDurRef.current = audio.duration;
          setAudioDuration(audio.duration);
        }
      });

      audio.addEventListener('ended', () => stopAudio());

      // Start playback as soon as enough data is buffered
      audio.src = url;
      await audio.play();
      setLoadingId(null);
      setPlayingId(rec.id);
      setIsPaused(false);
      startTick();
    } catch {
      setLoadingId(null);
      toast.error('Hiba a lejátszásnál');
    }
  }

  function handleSeek(fraction: number) {
    if (!audioRef.current) return;
    const dur = isFinite(audioRef.current.duration)
      ? audioRef.current.duration
      : knownDurRef.current;
    if (dur > 0) {
      audioRef.current.currentTime = fraction * dur;
      setProgress(fraction);
      setCurrentTime(fraction * dur);
    }
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
    if (playingId === deleteConfirmId) stopAudio();
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
        {recordings.map((rec) => {
          const isPlaying = playingId === rec.id;
          const isEditing = editingId === rec.id;

          return (
            <div key={rec.id}
              className="group relative rounded-lg px-2 py-2 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                {/* Play button */}
                <button
                  onClick={() => { togglePlay(rec); }}
                  disabled={loadingId === rec.id}
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-[color,background-color,border-color,opacity,transform] ${
                    loadingId === rec.id
                      ? 'bg-primary/20 text-primary-text'
                      : isPlaying
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                  }`}
                >
                  {loadingId === rec.id ? (
                    <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" />
                  ) : isPlaying && !isPaused ? (
                    <Pause className="size-3.5" />
                  ) : (
                    <Play className="size-3.5 ml-0.5" />
                  )}
                </button>

                {/* Info */}
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
                    <p className="text-sm font-medium leading-tight">
                      <ExpandableText className="block" clampClassName="truncate">{rec.name}</ExpandableText>
                    </p>
                  )}
                </div>

                {/* Actions */}
                {!isEditing && (
                  <div className="flex items-center gap-0.5 shrink-0 opacity-100 transition-opacity hover-device:opacity-0 hover-device:group-hover:opacity-100">
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

              {/* Seekable progress bar — shown when playing */}
              {isPlaying && !isEditing && (
                <div className="mt-1.5 ml-11">
                  <SeekableProgress
                    progress={progress}
                    duration={audioDuration}
                    currentTime={currentTime}
                    onSeek={handleSeek}
                  />
                </div>
              )}

              {/* Duration when not playing */}
              {!isPlaying && !isEditing && (
                <p className="text-[10px] text-muted-foreground/50 ml-11 tabular-nums">{formatTime(rec.duration)}</p>
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
                    <p className="text-xs text-muted-foreground">Időtartam: {formatTime(elapsed)}</p>
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

          {/* Recordings list */}
          {recordings.length > 0 && (
            <div className="border-t border-border/30 pt-4">
              <RecordingsList recordings={recordings} onUpdate={loadRecordings} />
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
