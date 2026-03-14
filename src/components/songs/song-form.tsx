'use client';

import { useTransition, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Star, ExternalLink, ChevronDown, ChevronUp, Search, Sparkles, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { YouTubePlayer } from '@/components/youtube/youtube-player';
import { createSong, updateSong } from '@/actions/songs';
import type { Song } from '@/types';

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

  // Track form changes
  const markDirty = useCallback(() => { if (!isDirty) setIsDirty(true); }, [isDirty]);

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
          toast.success('Dal sikeresen hozzáadva');
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
    <div className="mx-auto max-w-lg animate-fade-up h-[calc(100dvh-8rem)]">
      <div className="flex flex-col h-full rounded-xl border border-border/50 bg-card/50 overflow-hidden shadow-sm">
        <div className="p-6 pb-4 shrink-0">
          <h2 className="text-lg font-semibold tracking-tight">
            {isEdit ? 'Dal szerkesztése' : 'Új dal hozzáadása'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEdit ? 'Módosítsd a dal adatait' : 'Adj hozzá egy új dalt a közös listához'}
          </p>
        </div>

        <form action={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
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

              {/* YouTube search results */}
              {ytShowResults && (
                <div className="mt-2 rounded-lg border border-border/50 bg-background/80 overflow-hidden animate-fade-up">
                  {ytSearching ? (
                    <div className="flex items-center justify-center gap-2 py-6">
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Keresés...</span>
                    </div>
                  ) : ytResults.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Nem találtam eredményt
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between px-3 py-2 bg-secondary/30 border-b border-border/30">
                        <p className="text-xs font-medium text-muted-foreground">
                          Guitar tutorial ajánlatok ({ytResults.length})
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-muted-foreground"
                          onClick={() => setYtShowResults(false)}
                        >
                          Mégse
                        </Button>
                      </div>
                      <div className="max-h-[264px] overflow-y-auto divide-y divide-border/30">
                        {ytResults.map((result, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-3 transition-colors hover:bg-secondary/20"
                          >
                            <div className="relative shrink-0 w-24 aspect-video rounded-md overflow-hidden bg-secondary">
                              {result.thumbnail && (
                                <img
                                  src={result.thumbnail}
                                  alt={result.title}
                                  className="w-full h-full object-cover"
                                />
                              )}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Play className="size-4 text-white fill-white" />
                              </div>
                              {result.duration > 0 && (
                                <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 py-0.5 text-[10px] font-medium text-white tabular-nums">
                                  {formatDuration(result.duration)}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium leading-tight line-clamp-2">{result.title}</p>
                              <p className="mt-1 text-xs text-muted-foreground truncate">{result.channel}</p>
                              {result.views > 0 && (
                                <p className="text-xs text-muted-foreground/60">{formatViews(result.views)} megtekintés</p>
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
                    </div>
                  )}
                </div>
              )}
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
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowTabSection(!showTabSection)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>Gitár tab / akkordok</span>
                  {showTabSection ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
                {searchUrl && (
                  <a
                    href={searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Search className="size-3.5" />
                    Keresés az Ultimate Guitar-on
                  </a>
                )}
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
  );
}
