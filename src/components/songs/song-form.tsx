'use client';

import { useTransition, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';
import { Star, ExternalLink, ChevronDown, ChevronUp, Search, Sparkles, Loader2, Play, FileText, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import dynamic from 'next/dynamic';

const YouTubePlayer = dynamic(() => import('@/components/youtube/youtube-player').then(m => ({ default: m.YouTubePlayer })), { ssr: false });
import { createSong, updateSong } from '@/actions/songs';
import { getLinkedSpotifyPlaylist, createSpotifyPlaylist } from '@/actions/spotify';
import type { Song } from '@/types';
import { TruncatedText } from '@/components/shared/truncated-text';
import { ExpandableText } from '@/components/shared/expandable-text';

interface TabResult {
  id: number;
  songName: string;
  artist: string;
  type: string;
  version: number;
  votes: number;
  rating: number;
  tonality: string;
}

interface YouTubeResult {
  url: string;
  title: string;
  thumbnail: string;
  channel: string;
  duration: number;
  views: number;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(0)}K`;
  return String(views);
}

function SpotifyIconSmall() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="#1DB954">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

interface SongFormProps {
  song?: Song;
}

export function SongForm({ song }: SongFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [youtubeUrl, setYoutubeUrl] = useState(song?.youtubeUrl ?? '');
  const [difficulty, setDifficulty] = useState(song?.difficulty ?? 3);
  const [showTabSection, setShowTabSection] = useState(!!(song?.tabContent || song?.tabUrl));
  const [title, setTitle] = useState(song?.title ?? '');
  const [artist, setArtist] = useState(song?.artist ?? '');
  const isEdit = !!song;
  const [isDirty, setIsDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [ytResults, setYtResults] = useState<YouTubeResult[]>([]);
  const [ytSearching, setYtSearching] = useState(false);
  const [ytShowResults, setYtShowResults] = useState(false);
  const youtubeInputRef = useRef<HTMLInputElement>(null);
  const [tabResults, setTabResults] = useState<TabResult[]>([]);
  const [tabSearching, setTabSearching] = useState(false);
  const [tabShowResults, setTabShowResults] = useState(false);
  const [tabFetching, setTabFetching] = useState<number | null>(null);
  const tabContentRef = useRef<HTMLTextAreaElement>(null);
  const tabUrlRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [showSpotifyOffer, setShowSpotifyOffer] = useState(false);
  const [spotifyPlaylistName, setSpotifyPlaylistName] = useState('');
  const [spotifyCreating, setSpotifyCreating] = useState(false);

  // Track form changes
  const markDirty = useCallback(() => { if (!isDirty) setIsDirty(true); }, [isDirty]);

  // Track scroll position to show/hide scroll indicator
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function checkScroll() {
      if (!el) return;
      const hasMore = el.scrollHeight - el.scrollTop - el.clientHeight > 40;
      setShowScrollHint(hasMore);
    }
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, [showTabSection]);

  // Warn before browser close/refresh
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  function handleBack() {
    if (isDirty && !window.confirm('Nem mentett változtatásaid vannak. Biztosan el akarsz navigálni?')) {
      return;
    }
    router.back();
  }

  const searchUrl = title && artist
    ? `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(`${artist} ${title}`)}`
    : '';

  async function handleYoutubeSearch() {
    if (!title.trim() || !artist.trim()) {
      toast.error('Először add meg a dal címét és az előadót');
      return;
    }
    setYtSearching(true);
    setYtShowResults(true);
    try {
      const query = `${title} ${artist} guitar tutorial`;
      const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.results) {
        setYtResults(data.results);
      } else {
        toast.error('Nem sikerült a keresés');
        setYtResults([]);
      }
    } catch {
      toast.error('Hiba a YouTube keresésnél');
      setYtResults([]);
    } finally {
      setYtSearching(false);
    }
  }

  function selectYoutubeResult(url: string) {
    setYoutubeUrl(url);
    // Update the hidden/visible input
    if (youtubeInputRef.current) {
      youtubeInputRef.current.value = url;
    }
    setYtShowResults(false);
    markDirty();
    toast.success('YouTube link kiválasztva');
  }

  async function handleTabSearch() {
    if (!title.trim() || !artist.trim()) {
      toast.error('Először add meg a dal címét és az előadót');
      return;
    }
    setTabSearching(true);
    setTabShowResults(true);
    setShowTabSection(true);
    try {
      const query = `${title} ${artist}`;
      const res = await fetch(`/api/tab-search?q=${encodeURIComponent(query)}&artist=${encodeURIComponent(artist)}`);
      const data = await res.json();
      if (data.results) {
        setTabResults(data.results);
      } else {
        toast.error('Nem sikerült a keresés');
        setTabResults([]);
      }
    } catch {
      toast.error('Hiba a tab keresésnél');
      setTabResults([]);
    } finally {
      setTabSearching(false);
    }
  }

  async function selectTabResult(tab: TabResult) {
    setTabFetching(tab.id);
    try {
      const res = await fetch(`/api/tab-fetch?id=${tab.id}`);
      const data = await res.json();
      if (data.content) {
        // Populate tab content textarea
        if (tabContentRef.current) {
          tabContentRef.current.value = data.content;
        }
        // Set the UG web URL in tabUrl input
        const ugUrl = `https://tabs.ultimate-guitar.com/tab/${tab.artist.toLowerCase().replace(/\s+/g, '-')}/${tab.songName.toLowerCase().replace(/\s+/g, '-')}-${tab.type.toLowerCase()}-${tab.id}`;
        if (tabUrlRef.current) {
          tabUrlRef.current.value = ugUrl;
        }
        setTabShowResults(false);
        markDirty();
        toast.success('Tab betöltve!');
      } else {
        toast.error('Nem sikerült a tab letöltése');
      }
    } catch {
      toast.error('Hiba a tab letöltésnél');
    } finally {
      setTabFetching(null);
    }
  }

  async function handleCreateSpotifyPlaylist() {
    if (!spotifyPlaylistName.trim()) {
      toast.error('Add meg a playlist nevét');
      return;
    }
    setSpotifyCreating(true);
    try {
      const res = await createSpotifyPlaylist(spotifyPlaylistName.trim());
      toast.success(`Spotify playlist létrehozva! (${res.tracksFound}/${res.tracksTotal} dal)`, {
        action: {
          label: 'Megnyitás',
          onClick: () => window.open(res.playlistUrl, '_blank'),
        },
      });
      setShowSpotifyOffer(false);
      router.push('/songs');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message === 'SPOTIFY_SCOPE_MISMATCH') {
        toast.error('A Spotify jogosultságok frissültek — kösd össze újra a Spotify-t a Beállításokban');
      } else {
        toast.error('Nem sikerült a playlist létrehozása');
      }
    } finally {
      setSpotifyCreating(false);
    }
  }

  function handleSubmit(formData: FormData) {
    formData.set('difficulty', String(difficulty));

    startTransition(async () => {
      try {
        let result;
        if (isEdit) {
          result = await updateSong(song.id, formData);
          toast.success('Dal sikeresen frissítve');
        } else {
          result = await createSong(formData);

          // Handle Spotify auto-add result — combine into single toast
          const sp = result?.spotify;
          if (sp?.added) {
            toast.success('Dal sikeresen hozzáadva', {
              description: 'Spotify playlisthez is hozzáadva ✓',
              icon: <SpotifyIconSmall />,
              action: sp.playlistUrl ? {
                label: 'Megnyitás',
                onClick: () => window.open(sp.playlistUrl!, '_blank'),
              } : undefined,
            });
          } else if (sp?.noPlaylist) {
            toast.success('Dal sikeresen hozzáadva');
            // Check if Spotify is connected — if so, offer playlist creation
            try {
              const status = await getLinkedSpotifyPlaylist();
              if (status.spotifyConnected) {
                setSpotifyPlaylistName('ChordMate Playlist');
                setShowSpotifyOffer(true);
                // Don't navigate yet, wait for dialog
                return;
              }
            } catch {
              // Ignore — just proceed
            }
          } else if (sp?.notFound) {
            toast.success('Dal sikeresen hozzáadva', {
              description: '⚠️ A dal nem található a Spotify-on',
              icon: <SpotifyIconSmall />,
            });
          } else if (sp?.needsReauth) {
            toast.success('Dal sikeresen hozzáadva', {
              description: '⚠️ Spotify jogosultságok frissítése szükséges — csatlakoztasd újra a Beállításokban',
              icon: <SpotifyIconSmall />,
            });
          } else if (sp?.error) {
            toast.success('Dal sikeresen hozzáadva', {
              description: '⚠️ Nem sikerült a Spotify playlisthez adni',
              icon: <SpotifyIconSmall />,
            });
          } else {
            toast.success('Dal sikeresen hozzáadva');
          }
        }
        if (result?.imageFound) {
          toast.success('Borítókép automatikusan betöltve', { icon: '🎵' });
        }
        router.push('/songs');
      } catch {
        toast.error('Hiba történt, próbáld újra');
      }
    });
  }

  const difficultyColors = ['text-green-500', 'text-lime-500', 'text-yellow-500', 'text-orange-500', 'text-red-500'];

  return (
    <>
    {/* Mobile: blurred backdrop overlay (like Dialog/TAB modal) */}
    <div className="fixed inset-0 z-[60] bg-black/10 backdrop-blur-sm md:hidden" />
    <div className="mx-auto max-w-lg animate-fade-up md:h-[calc(100dvh-8rem)] max-md:fixed max-md:inset-0 max-md:z-[60] max-md:max-w-none">
      <div className="flex flex-col h-full rounded-xl border border-border/50 overflow-hidden md:bg-card/50 md:shadow-sm max-md:bg-card max-md:shadow-2xl max-md:ring-1 max-md:ring-foreground/10">
        <div className="p-6 pb-4 shrink-0">
          <h2 className="text-lg font-semibold tracking-tight">
            {isEdit ? 'Dal szerkesztése' : 'Új dal hozzáadása'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEdit ? 'Módosítsd a dal adatait' : 'Adj hozzá egy új dalt a közös listához'}
          </p>
        </div>

        <form action={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-6 pb-6 pt-2">
            <div className="flex flex-col gap-5">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title" className="text-sm font-medium">Dal címe *</Label>
              <Input
                id="title"
                name="title"
                defaultValue={song?.title}
                placeholder="pl. Hotel California"
                className="h-10 rounded-lg bg-background/50"
                onChange={(e) => { setTitle(e.target.value); markDirty(); }}
                required
              />
            </div>

            {/* Artist */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="artist" className="text-sm font-medium">Előadó *</Label>
              <Input
                id="artist"
                name="artist"
                defaultValue={song?.artist}
                placeholder="pl. Eagles"
                className="h-10 rounded-lg bg-background/50"
                onChange={(e) => { setArtist(e.target.value); markDirty(); }}
                required
              />
            </div>

            {/* YouTube (optional) */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="youtubeUrl" className="text-sm font-medium">
                YouTube link <span className="text-muted-foreground">(opcionális)</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  ref={youtubeInputRef}
                  id="youtubeUrl"
                  name="youtubeUrl"
                  value={youtubeUrl}
                  placeholder="https://youtube.com/watch?v=..."
                  onChange={(e) => { setYoutubeUrl(e.target.value); markDirty(); }}
                  className="h-10 rounded-lg bg-background/50 flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 gap-1.5 shrink-0 text-xs"
                  onClick={handleYoutubeSearch}
                  disabled={ytSearching || !title.trim() || !artist.trim()}
                >
                  {ytSearching ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                  <span className="hidden sm:inline">Ajánló</span>
                </Button>
              </div>

            </div>

            {youtubeUrl && youtubeUrl.includes('youtu') && (
              <div className="overflow-hidden rounded-lg">
                <YouTubePlayer url={youtubeUrl} />
              </div>
            )}

            {/* Difficulty */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium">Nehézség</Label>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setDifficulty(i + 1 === difficulty ? 0 : i + 1)}
                    className="rounded-md p-1 transition-colors hover:bg-secondary/50"
                  >
                    <Star
                      className={`size-5 cursor-pointer transition-colors ${
                        i < difficulty
                          ? difficultyColors[difficulty - 1] + ' fill-current'
                          : 'text-muted-foreground/20 hover:text-muted-foreground/40'
                      }`}
                    />
                  </button>
                ))}
                {difficulty > 0 && (
                  <span className="ml-1 text-sm text-muted-foreground">{difficulty}/5</span>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes" className="text-sm font-medium">
                Megjegyzés <span className="text-muted-foreground">(opcionális)</span>
              </Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={song?.notes ?? ''}
                placeholder='pl. "Capo 2. érintőn"'
                rows={2}
                className="rounded-lg bg-background/50 resize-none"
                onChange={markDirty}
              />
            </div>

            {/* Tab section (collapsible) */}
            <div className="border-t border-border/30 pt-4">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowTabSection(!showTabSection)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>Gitár tab / akkordok</span>
                  {showTabSection ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
                <div className="flex items-center gap-2">
                  {title && artist && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs h-8"
                      onClick={handleTabSearch}
                      disabled={tabSearching}
                    >
                      {tabSearching ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="size-3.5" />
                      )}
                      Tab ajánló
                    </Button>
                  )}
                  {searchUrl && (
                    <a
                      href={searchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Search className="size-3.5" />
                      <span className="hidden sm:inline">Ultimate Guitar</span>
                    </a>
                  )}
                </div>
              </div>


              {showTabSection && (
                <div className="mt-4 flex flex-col gap-4 animate-fade-up">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="tabUrl" className="text-sm font-medium">
                        Tab URL <span className="text-muted-foreground">(Ultimate Guitar, stb.)</span>
                      </Label>
                    </div>
                    <Input
                      ref={tabUrlRef}
                      id="tabUrl"
                      name="tabUrl"
                      defaultValue={song?.tabUrl ?? ''}
                      placeholder="https://tabs.ultimate-guitar.com/..."
                      className="h-10 rounded-lg bg-background/50"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="tabContent" className="text-sm font-medium">
                      Tab tartalom <span className="text-muted-foreground">(másold be ide)</span>
                    </Label>
                    <Textarea
                      ref={tabContentRef}
                      id="tabContent"
                      name="tabContent"
                      defaultValue={song?.tabContent ?? ''}
                      placeholder={"Am        C\nHello, it's me\nF             G\nI was wondering..."}
                      rows={8}
                      className="rounded-lg bg-background/50 font-mono text-sm resize-y"
                      onChange={markDirty}
                    />
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>

          {/* YouTube Recommendations Dialog */}
          <Dialog open={ytShowResults} onOpenChange={setYtShowResults}>
            <DialogContent className="max-w-[90vw] sm:max-w-lg max-h-[90vh] flex flex-col" showCloseButton={false}>
              <DialogHeader className="shrink-0">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-base">YouTube ajánló</DialogTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground"
                    onClick={() => setYtShowResults(false)}
                  >
                    Mégse
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {title} – {artist}
                </p>
              </DialogHeader>

              {ytSearching ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Keresés...</span>
                </div>
              ) : ytResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12">
                  <Play className="size-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Nem találtam eredményt</p>
                </div>
              ) : (
                <div className="flex-1 min-h-0 overflow-y-auto -mx-4 divide-y divide-border/30">
                  {ytResults.map((result, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/20"
                    >
                      <div className="relative shrink-0 w-28 aspect-video rounded-md overflow-hidden bg-secondary">
                        {result.thumbnail && (
                          <Image
                            src={result.thumbnail}
                            alt={result.title}
                            fill
                            sizes="112px"
                            className="object-cover"
                            unoptimized
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="size-5 text-white fill-white" />
                        </div>
                        {result.duration > 0 && (
                          <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 py-0.5 text-[10px] font-medium text-white tabular-nums">
                            {formatDuration(result.duration)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">
                          <ExpandableText className="block" clampClassName="line-clamp-2">{result.title}</ExpandableText>
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          <ExpandableText className="block" clampClassName="truncate">{result.channel}</ExpandableText>
                        </p>
                        {result.views > 0 && (
                          <p className="text-[11px] text-muted-foreground/60">{formatViews(result.views)} megtekintés</p>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          className="mt-2 h-7 px-3 text-xs gap-1.5"
                          onClick={() => selectYoutubeResult(result.url)}
                        >
                          Video beállítása
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Tab Recommendations Dialog */}
          <Dialog open={tabShowResults} onOpenChange={setTabShowResults}>
            <DialogContent className="max-w-[90vw] sm:max-w-lg max-h-[90vh] flex flex-col" showCloseButton={false}>
              <DialogHeader className="shrink-0">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-base">Tab ajánló</DialogTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground"
                    onClick={() => setTabShowResults(false)}
                  >
                    Mégse
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {title} – {artist}
                </p>
              </DialogHeader>

              {tabSearching ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Keresés az Ultimate Guitar-on...</span>
                </div>
              ) : tabResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12">
                  <FileText className="size-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Nem találtam tabot ehhez a dalhoz</p>
                </div>
              ) : (
                <div className="flex-1 min-h-0 overflow-y-auto -mx-4 divide-y divide-border/30">
                  {tabResults.map((tab) => (
                    <div
                      key={tab.id}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/20"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 ring-1 ring-primary/10">
                        <FileText className="size-4 text-primary/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium min-w-0">
                            <ExpandableText className="block" clampClassName="truncate">{tab.songName}</ExpandableText>
                          </p>
                          <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {tab.type}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <ExpandableText className="block" clampClassName="truncate">{tab.artist}</ExpandableText>
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[11px] text-muted-foreground/70">
                            ★ {tab.rating.toFixed(1)}
                          </span>
                          <span className="text-[11px] text-muted-foreground/70">
                            {tab.votes.toLocaleString()} szavazat
                          </span>
                          {tab.version > 1 && (
                            <span className="text-[11px] text-muted-foreground/70">
                              v{tab.version}
                            </span>
                          )}
                          {tab.tonality && (
                            <span className="text-[11px] text-muted-foreground/70">
                              {tab.tonality}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="shrink-0 h-8 px-3 text-xs gap-1.5"
                        onClick={() => selectTabResult(tab)}
                        disabled={tabFetching === tab.id}
                      >
                        {tabFetching === tab.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <FileText className="size-3" />
                        )}
                        Betöltés
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Scroll indicator */}
          {showScrollHint && (
            <div className="shrink-0 relative">
              <div className="absolute -top-10 left-0 right-0 h-10 bg-gradient-to-t from-card to-transparent pointer-events-none" />
              <div className="flex justify-center py-2 border-t border-border/30">
                <div className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 animate-bounce">
                  <ChevronDown className="size-4 text-primary" />
                  <span className="text-xs font-medium text-primary">Görgess lejjebb</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="shrink-0 flex justify-end gap-2 border-t border-border/30 bg-card/50 px-6 py-4">
            <Button type="button" variant="ghost" onClick={handleBack} disabled={isPending}>
              Mégse
            </Button>
            <Button type="submit" disabled={isPending} className="min-w-[100px]">
              {isPending ? 'Mentés...' : 'Mentés'}
            </Button>
          </div>
        </form>
      </div>
    </div>

    {/* Spotify Playlist Creation Offer Dialog */}
    <Dialog
      open={showSpotifyOffer}
      onOpenChange={(open) => {
        if (!open && !spotifyCreating) {
          setShowSpotifyOffer(false);
          router.push('/songs');
        }
      }}
    >
      <DialogContent className="max-w-[90vw] sm:max-w-md" showCloseButton={!spotifyCreating}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SpotifyIconSmall />
            Spotify Playlist létrehozása
          </DialogTitle>
          <DialogDescription>
            Még nincs Spotify playlist a dallistádhoz. Szeretnél egyet létrehozni? Az összes dalod automatikusan hozzá lesz adva, és az új dalok is automatikusan bekerülnek.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="spotify-playlist-name" className="text-sm font-medium">Playlist neve</Label>
            <Input
              id="spotify-playlist-name"
              value={spotifyPlaylistName}
              onChange={(e) => setSpotifyPlaylistName(e.target.value)}
              placeholder="pl. ChordMate Playlist"
              className="h-10"
              autoFocus
              disabled={spotifyCreating}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateSpotifyPlaylist();
              }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowSpotifyOffer(false);
                router.push('/songs');
              }}
              disabled={spotifyCreating}
            >
              Most nem
            </Button>
            <Button
              type="button"
              className="gap-2"
              style={{ backgroundColor: '#1DB954', color: '#000' }}
              onClick={handleCreateSpotifyPlaylist}
              disabled={spotifyCreating || !spotifyPlaylistName.trim()}
            >
              {spotifyCreating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <SpotifyIconSmall />
              )}
              Playlist létrehozása
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
