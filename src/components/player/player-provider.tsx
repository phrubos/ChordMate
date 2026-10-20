'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
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

  useEffect(() => {
    const p = playerRef.current;
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

  useEffect(() => {
    if (!state.isExpanded) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dispatch({ type: 'expand', value: false });
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.isExpanded]);

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
      expand: (v: boolean) => dispatch({ type: 'expand', value: v }),
    }),
    [state, current, progress, play]
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
          aria-hidden={!state.isExpanded}
          className={cn(
            state.isExpanded
              ? 'fixed inset-0 z-[80] flex items-end justify-center bg-scrim/70 animate-in fade-in-0 duration-200 md:items-center'
              : 'pointer-events-none fixed top-0 left-0 size-px overflow-hidden opacity-0'
          )}
          onClick={(e) => e.target === e.currentTarget && dispatch({ type: 'expand', value: false })}
        >
          <div
            role={state.isExpanded ? 'dialog' : undefined}
            aria-modal={state.isExpanded || undefined}
            aria-label={state.isExpanded ? `Videó: ${current?.title}` : undefined}
            className={cn(
              state.isExpanded
                ? 'w-full rounded-t-2xl border-t border-border-strong bg-card p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-300 ease-(--ease-drawer) md:max-w-3xl md:rounded-xl md:border md:slide-in-from-bottom-0 md:zoom-in-[0.96] md:duration-200 md:ease-(--ease-out) motion-reduce:slide-in-from-bottom-0 motion-reduce:zoom-in-100'
                : 'size-px'
            )}
          >
            {state.isExpanded && (
              <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{current?.title}</p>
                  <p className="truncate text-[13px] text-muted-foreground">{current?.artist}</p>
                </div>
                <Button variant="ghost" size="icon" aria-label="Videó bezárása" autoFocus onClick={() => dispatch({ type: 'expand', value: false })}>
                  <X />
                </Button>
              </div>
            )}
            <div className={cn('relative overflow-hidden rounded-lg bg-scrim', state.isExpanded ? 'aspect-video w-full' : 'size-px')}>
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
