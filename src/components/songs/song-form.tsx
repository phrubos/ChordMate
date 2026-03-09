'use client';

import { useTransition, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Star, ExternalLink, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { YouTubePlayer } from '@/components/youtube/youtube-player';
import { createSong, updateSong } from '@/actions/songs';
import type { Song } from '@/types';

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
    <div className="mx-auto max-w-lg animate-fade-up">
      <div className="rounded-xl border border-border/50 bg-card/50 p-6">
        <h2 className="text-lg font-semibold tracking-tight">
          {isEdit ? 'Dal szerkesztése' : 'Új dal hozzáadása'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEdit ? 'Módosítsd a dal adatait' : 'Adj hozzá egy új dalt a közös listához'}
        </p>

        <form action={handleSubmit} className="mt-6">
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
              <Input
                id="youtubeUrl"
                name="youtubeUrl"
                defaultValue={song?.youtubeUrl ?? ''}
                placeholder="https://youtube.com/watch?v=..."
                onChange={(e) => { setYoutubeUrl(e.target.value); markDirty(); }}
                className="h-10 rounded-lg bg-background/50"
              />
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

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-2 border-t border-border/30 pt-4">
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
