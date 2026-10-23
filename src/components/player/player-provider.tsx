'use client';

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import YouTube, { type YouTubeEvent, type YouTubePlayer as YTPlayer } from 'react-youtube';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getRecordingAudio } from '@/actions/recordings';
import { extractYoutubeId } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { buildQueue, initialPlayerState, playerReducer, toTrack, type PlayerState, type PlayerTrack, type SongLike } from '@/lib/player-state';

interface PlayerContextValue {
  state: PlayerState;
  current: PlayerTrack | null;
  /** A recording's audio is still being fetched. */
  loading: boolean;
  play: (song: SongLike, queue?: SongLike[]) => void;
  /** Any track (e.g. own recordings) with its queue. */
  playTrack: (track: PlayerTrack, queue?: PlayerTrack[]) => void;
  seek: (seconds: number) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  close: () => void;
  expand: (value: boolean) => void;
  /** 'video': the video shows in the page's video slot; 'audio': it only plays in the mini player. */
  mode: PlayerMode;
  setMode: (mode: PlayerMode) => void;
  /** A page registers where a song's video should appear inline (pass null to unregister). */
  dock: (el: HTMLElement | null, songId: string) => void;
}

export type PlayerMode = 'video' | 'audio';
const MODE_KEY = 'chordmate:player-mode';
const modeListeners = new Set<() => void>();
/** Fallback when storage is unavailable (private mode, blocked site data). */
let memoryMode: PlayerMode = 'video';

function readMode(): PlayerMode {
  try {
    const saved = localStorage.getItem(MODE_KEY);
    return saved === 'audio' || saved === 'video' ? saved : memoryMode;
  } catch {
    return memoryMode;
  }
}

function subscribeMode(listener: () => void) {
  modeListeners.add(listener);
  return () => modeListeners.delete(listener);
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside <PlayerProvider>');
  return ctx;
}

/** Null outside a provider (Próba mód has none; the recording modal then brings its own). */
export function usePlayerOptional(): PlayerContextValue | null {
  return useContext(PlayerContext);
}

/** Playback position, updated every frame while playing; `scrub` is a seek bar being dragged. */
export interface PlayerTime {
  current: number;
  duration: number;
  scrub: number | null;
}

interface PlayerTimeStore {
  subscribe: (listener: () => void) => () => void;
  get: () => PlayerTime;
  /** Show a drag preview everywhere (bars, time text) without seeking yet; null ends it. */
  setScrub: (seconds: number | null) => void;
}

const ZERO_TIME: PlayerTime = { current: 0, duration: 0, scrub: null };
const PlayerTimeContext = createContext<PlayerTimeStore | null>(null);

/**
 * Separate from the player context on purpose: only what shows the position re-renders every frame,
 * not every `usePlayer()` consumer.
 */
export function usePlayerTime(): PlayerTime & { setScrub: PlayerTimeStore['setScrub'] } {
  const store = useContext(PlayerTimeContext);
  if (!store) throw new Error('usePlayerTime must be used inside <PlayerProvider>');
  const time = useSyncExternalStore(store.subscribe, store.get, () => ZERO_TIME);
  return { ...time, setScrub: store.setScrub };
}

/** Recording id → object URL of its audio. */
export type RecordingLoader = (recordingId: string) => Promise<string>;

const loadRecordingAudio: RecordingLoader = async (id) => {
  const { audioData, mimeType } = await getRecordingAudio(id);
  const binary = atob(audioData);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
};

const YT_PLAYING = 1;
const YT_PAUSED = 2;

/**
 * Owns the single YouTube iframe for the whole app shell. The iframe never unmounts on
 * route changes; "expanding" only restyles its container (moving an iframe in the DOM reloads it).
 * Own recordings play through a hidden <audio> with the same controls and queue.
 */
export function PlayerProvider({ children, loadRecording = loadRecordingAudio }: { children: ReactNode; loadRecording?: RecordingLoader }) {
  const [state, dispatch] = useReducer(playerReducer, initialPlayerState);
  const playerRef = useRef<YTPlayer | null>(null);
  const current = state.queue[state.index] ?? null;
  const videoId = current?.kind === 'youtube' ? extractYoutubeId(current.youtubeUrl) : null;
  const recordingId = current?.kind === 'recording' ? current.recordingId : null;
  const mode = useSyncExternalStore(subscribeMode, readMode, (): PlayerMode => 'video');
  const [slot, setSlot] = useState<{ el: HTMLElement; songId: string } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  // Collapsing plays the exit first (A2); the box only restyles to docked/hidden once it has finished.
  const [closing, setClosing] = useState(false);
  const docked = !state.isExpanded && mode === 'video' && !!slot && slot.songId === current?.id;

  const setMode = useCallback((m: PlayerMode) => {
    memoryMode = m;
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {}
    modeListeners.forEach((l) => l());
  }, []);

  const dock = useCallback((el: HTMLElement | null, songId: string) => {
    setSlot((prev) => (el ? { el, songId } : prev?.songId === songId ? null : prev));
  }, []);

  // Docked: keep the (never re-parented) iframe box glued over the slot. A rAF loop also catches
  // layout shifts that neither scroll nor resize events report (tab switches, content above growing).
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!docked || !box || !slot) return;
    let raf = 0;
    let last = '';
    const tick = () => {
      const r = slot.el.getBoundingClientRect();
      const key = `${r.top}|${r.left}|${r.width}|${r.height}`;
      if (key !== last) {
        last = key;
        Object.assign(box.style, {
          top: `${r.top}px`,
          left: `${r.left}px`,
          width: `${r.width}px`,
          height: `${r.height}px`,
          visibility: r.width > 0 ? 'visible' : 'hidden',
        });
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      box.removeAttribute('style');
    };
  }, [docked, slot]);

  useEffect(() => {
    const p = playerRef.current;
    // Closing unmounts the iframe; a stale ref would call into a destroyed player on the next play.
    if (!videoId) playerRef.current = null;
    if (!p || !videoId) return;
    if (state.isPlaying) p.playVideo();
    else p.pauseVideo();
  }, [state.isPlaying, videoId]);

  // --- Own recordings ---
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioUrls = useRef(new Map<string, string>());
  /** The recording whose audio was put into the <audio> element — a new object on every load, so the play effect re-runs. */
  const [ready, setReady] = useState<{ id: string } | null>(null);
  const readyId = ready?.id ?? null;
  const loading = !!recordingId && readyId !== recordingId;
  // Pause events while switching sources are ours, not the user's.
  const switching = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!recordingId) {
      if (audio.getAttribute('src')) {
        switching.current = true;
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      }
      return;
    }
    let stale = false;
    switching.current = true;
    audio.pause();
    (async () => {
      try {
        const url = audioUrls.current.get(recordingId) ?? (await loadRecording(recordingId));
        audioUrls.current.set(recordingId, url);
        if (stale) return;
        audio.src = url;
        setReady({ id: recordingId });
      } catch {
        if (stale) return;
        toast.error('Nem sikerült betölteni a felvételt');
        dispatch({ type: 'setPlaying', value: false });
      }
    })();
    return () => {
      stale = true;
    };
  }, [recordingId, loadRecording]);

  // Closed (or unmounted): free the decoded files.
  const closed = !current;
  useEffect(() => {
    const urls = audioUrls.current;
    const free = () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
    if (closed) free();
    return free;
  }, [closed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !recordingId || ready?.id !== recordingId) return;
    if (state.isPlaying) {
      audio
        .play()
        .then(() => (switching.current = false))
        // Autoplay policy or a broken file: show it as paused instead of pretending to play.
        .catch(() => dispatch({ type: 'setPlaying', value: false }));
    } else {
      switching.current = false;
      audio.pause();
    }
  }, [state.isPlaying, recordingId, ready]);

  // --- Position: a tiny external store, published every frame while playing ---
  const currentRef = useRef(current);
  useEffect(() => {
    currentRef.current = current;
  });
  const time = useRef<PlayerTime>(ZERO_TIME);
  const timeListeners = useRef(new Set<() => void>());
  const publish = useCallback((next: Partial<PlayerTime>) => {
    const prev = time.current;
    const merged = { ...prev, ...next };
    if (merged.current === prev.current && merged.duration === prev.duration && merged.scrub === prev.scrub) return;
    time.current = merged;
    timeListeners.current.forEach((l) => l());
  }, []);
  const timeStore = useMemo<PlayerTimeStore>(
    () => ({
      subscribe: (l) => {
        timeListeners.current.add(l);
        return () => timeListeners.current.delete(l);
      },
      get: () => time.current,
      setScrub: (scrub) => publish({ scrub }),
    }),
    [publish]
  );

  const readTime = useCallback((): Pick<PlayerTime, 'current' | 'duration'> => {
    const track = currentRef.current;
    if (track?.kind === 'youtube') {
      const p = playerRef.current;
      return { current: p?.getCurrentTime?.() ?? 0, duration: p?.getDuration?.() ?? 0 };
    }
    if (track?.kind === 'recording') {
      const a = audioRef.current;
      // MediaRecorder webm files often report Infinity until fully read: fall back to the saved length.
      const duration = a && Number.isFinite(a.duration) && a.duration > 0 ? a.duration : track.duration;
      return { current: readyId === track.recordingId ? (a?.currentTime ?? 0) : 0, duration };
    }
    return { current: 0, duration: 0 };
  }, [readyId]);

  useEffect(() => {
    currentRef.current = current;
    if (!current) {
      publish(ZERO_TIME);
      return;
    }
    publish(readTime());
    if (!state.isPlaying) return;
    let raf = 0;
    const tick = () => {
      publish(readTime());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [current, state.isPlaying, publish, readTime]);

  const seek = useCallback(
    (seconds: number) => {
      const track = currentRef.current;
      if (track?.kind === 'youtube') playerRef.current?.seekTo(seconds, true);
      else if (track?.kind === 'recording' && audioRef.current) audioRef.current.currentTime = seconds;
      else return;
      publish({ current: seconds });
    },
    [publish]
  );

  const expand = useCallback(
    (v: boolean) => {
      if (v) {
        setClosing(false);
        dispatch({ type: 'expand', value: true });
      } else if (state.isExpanded) setClosing(true);
    },
    [state.isExpanded]
  );
  const finishClosing = useCallback(() => {
    setClosing(false);
    dispatch({ type: 'expand', value: false });
  }, []);

  // Fallback in case animationend never fires (animations disabled, tab hidden).
  useEffect(() => {
    if (!closing) return;
    const t = window.setTimeout(finishClosing, 400);
    return () => window.clearTimeout(t);
  }, [closing, finishClosing]);

  useEffect(() => {
    if (!state.isExpanded) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && expand(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.isExpanded, expand]);

  const play = useCallback((song: SongLike, queue?: SongLike[]) => {
    const tracks = buildQueue(queue ?? [song]);
    const track = toTrack(song) ?? tracks[0];
    if (track) dispatch({ type: 'play', track, queue: tracks });
  }, []);

  const playTrack = useCallback((track: PlayerTrack, queue?: PlayerTrack[]) => dispatch({ type: 'play', track, queue }), []);

  const value = useMemo<PlayerContextValue>(
    () => ({
      state,
      current,
      loading,
      play,
      playTrack,
      seek,
      toggle: () => dispatch({ type: 'toggle' }),
      next: () => dispatch({ type: 'next' }),
      prev: () => dispatch({ type: 'prev' }),
      close: () => {
        // The next play of the same recording must load again: closing empties the <audio>.
        setReady(null);
        dispatch({ type: 'close' });
      },
      expand,
      mode,
      setMode,
      dock,
    }),
    [state, current, loading, play, playTrack, seek, expand, mode, setMode, dock]
  );

  /** Keep our state in sync when the user plays/pauses inside the YouTube iframe itself. */
  const onStateChange = (e: YouTubeEvent<number>) => {
    if ((e.data === YT_PLAYING && !state.isPlaying) || (e.data === YT_PAUSED && state.isPlaying)) dispatch({ type: 'toggle' });
  };

  return (
    <PlayerContext.Provider value={value}>
      <PlayerTimeContext.Provider value={timeStore}>
        {children}
        <audio
          ref={audioRef}
          preload="auto"
          hidden
          onEnded={() => dispatch({ type: 'ended' })}
          // Headset buttons and OS media controls play/pause the element directly.
          onPlay={() => !switching.current && dispatch({ type: 'setPlaying', value: true })}
          onPause={(e) => !switching.current && !e.currentTarget.ended && dispatch({ type: 'setPlaying', value: false })}
        />
        {videoId && (
          <div
            ref={boxRef}
            data-player-box
            aria-hidden={!state.isExpanded && !docked}
            className={cn(
              state.isExpanded
                ? cn(
                    'fixed inset-0 z-[80] flex items-end justify-center bg-scrim/70 md:items-center',
                    closing ? 'animate-out fade-out-0 fill-mode-forwards duration-130' : 'animate-in fade-in-0 duration-200'
                  )
                : docked
                  ? 'fixed z-10 overflow-hidden rounded-[6px] bg-scrim'
                  : 'pointer-events-none fixed top-0 left-0 size-px overflow-hidden opacity-0'
            )}
            onClick={(e) => e.target === e.currentTarget && expand(false)}
          >
            <div
              role={state.isExpanded ? 'dialog' : undefined}
              aria-modal={state.isExpanded || undefined}
              aria-label={state.isExpanded ? `Videó: ${current?.title}` : undefined}
              onAnimationEnd={(e) => closing && e.target === e.currentTarget && finishClosing()}
              className={cn(
                state.isExpanded
                  ? cn(
                      'w-full rounded-t-2xl border-t border-border-strong bg-card p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:max-w-3xl md:rounded-xl md:border',
                      closing
                        ? 'animate-out fade-out-0 slide-out-to-bottom fill-mode-forwards duration-200 ease-(--ease-out) md:slide-out-to-bottom-0 md:zoom-out-[0.96] md:duration-130'
                        : 'animate-in slide-in-from-bottom duration-300 ease-(--ease-drawer) md:slide-in-from-bottom-0 md:zoom-in-[0.96] md:duration-200 md:ease-(--ease-out) motion-reduce:slide-in-from-bottom-0 motion-reduce:zoom-in-100'
                    )
                  : docked
                    ? 'size-full'
                    : 'size-px'
              )}
            >
              {state.isExpanded && (
                <div className="mb-3 flex items-center justify-between gap-3 px-1">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{current?.title}</p>
                    <p className="truncate text-[13px] text-muted-foreground">{current?.artist}</p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Videó bezárása" autoFocus onClick={() => expand(false)}>
                    <X />
                  </Button>
                </div>
              )}
              <div className={cn('relative overflow-hidden bg-scrim', state.isExpanded ? 'aspect-video w-full rounded-lg' : docked ? 'size-full' : 'size-px')}>
                <YouTube
                  videoId={videoId}
                  opts={{ width: '100%', height: '100%', playerVars: { autoplay: 1, modestbranding: 1, playsinline: 1 } }}
                  className="absolute inset-0"
                  iframeClassName="h-full w-full"
                  onReady={(e: YouTubeEvent) => {
                    playerRef.current = e.target;
                  }}
                  onStateChange={onStateChange}
                  onEnd={() => dispatch({ type: 'ended' })}
                />
              </div>
            </div>
          </div>
        )}
      </PlayerTimeContext.Provider>
    </PlayerContext.Provider>
  );
}
