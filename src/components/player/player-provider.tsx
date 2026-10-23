'use client';

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import YouTube, { type YouTubeEvent, type YouTubePlayer as YTPlayer } from 'react-youtube';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { extractYoutubeId } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { buildQueue, initialPlayerState, playerReducer, toTrack, type PlayerState, type PlayerTrack, type SongLike } from '@/lib/player-state';

interface PlayerContextValue {
  state: PlayerState;
  current: PlayerTrack | null;
  progress: { current: number; duration: number };
  play: (song: SongLike, queue?: SongLike[]) => void;
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

const YT_PLAYING = 1;
const YT_PAUSED = 2;

/**
 * Owns the single YouTube iframe for the whole app shell. The iframe never unmounts on
 * route changes; "expanding" only restyles its container (moving an iframe in the DOM reloads it).
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, initialPlayerState);
  const [progress, setProgress] = useState({ current: 0, duration: 0 });
  const playerRef = useRef<YTPlayer | null>(null);
  const current = state.queue[state.index] ?? null;
  const videoId = current ? extractYoutubeId(current.youtubeUrl) : null;
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

  useEffect(() => {
    if (!state.isPlaying) return;
    const id = window.setInterval(() => {
      const p = playerRef.current;
      if (p) setProgress({ current: p.getCurrentTime() ?? 0, duration: p.getDuration() ?? 0 });
    }, 500);
    return () => window.clearInterval(id);
  }, [state.isPlaying]);

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

  const value = useMemo<PlayerContextValue>(
    () => ({
      state,
      current,
      progress,
      play,
      toggle: () => dispatch({ type: 'toggle' }),
      next: () => dispatch({ type: 'next' }),
      prev: () => dispatch({ type: 'prev' }),
      close: () => dispatch({ type: 'close' }),
      expand,
      mode,
      setMode,
      dock,
    }),
    [state, current, progress, play, expand, mode, setMode, dock]
  );

  /** Keep our state in sync when the user plays/pauses inside the YouTube iframe itself. */
  const onStateChange = (e: YouTubeEvent<number>) => {
    if ((e.data === YT_PLAYING && !state.isPlaying) || (e.data === YT_PAUSED && state.isPlaying)) dispatch({ type: 'toggle' });
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
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
    </PlayerContext.Provider>
  );
}
