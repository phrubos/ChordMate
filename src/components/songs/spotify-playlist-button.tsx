'use client';

import { useState, useEffect, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Music, Loader2, ExternalLink, Unplug, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  getSpotifyConnectionStatus,
  disconnectSpotify,
  createSpotifyPlaylist,
} from '@/actions/spotify';

// Spotify brand color
const SPOTIFY_GREEN = '#1DB954';

function SpotifyIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

type DialogState = 'closed' | 'connect' | 'create' | 'creating' | 'success' | 'disconnect';

interface PlaylistResult {
  playlistUrl: string;
  tracksFound: number;
  tracksTotal: number;
  notFound: { title: string; artist: string }[];
}

interface SpotifyPlaylistButtonProps {
  bandName?: string;
}

export function SpotifyPlaylistButton({ bandName }: SpotifyPlaylistButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dialogState, setDialogState] = useState<DialogState>('closed');
  const [connected, setConnected] = useState<boolean | null>(null); // null = loading
  const [playlistName, setPlaylistName] = useState('');
  const [result, setResult] = useState<PlaylistResult | null>(null);
  const [isPending, startTransition] = useTransition();

  // Check connection status on mount
  useEffect(() => {
    getSpotifyConnectionStatus().then(status => {
      setConnected(status.connected);
    }).catch(() => {
      setConnected(false);
    });
  }, []);

  // Handle ?spotify= query param from OAuth callback
  useEffect(() => {
    const spotifyParam = searchParams.get('spotify');
    if (spotifyParam === 'connected') {
      setConnected(true);
      toast.success('Spotify fiók sikeresen összekapcsolva!', { icon: <SpotifyIcon className="size-4" /> });
      // Clean the URL
      const url = new URL(window.location.href);
      url.searchParams.delete('spotify');
      router.replace(url.pathname + url.search, { scroll: false });
    } else if (spotifyParam === 'denied') {
      toast.error('A Spotify hozzáférés meg lett tagadva');
      const url = new URL(window.location.href);
      url.searchParams.delete('spotify');
      router.replace(url.pathname + url.search, { scroll: false });
    } else if (spotifyParam === 'error') {
      toast.error('Hiba a Spotify összekapcsolásnál');
      const url = new URL(window.location.href);
      url.searchParams.delete('spotify');
      router.replace(url.pathname + url.search, { scroll: false });
    }
  }, [searchParams, router]);

  function handleButtonClick() {
    if (connected === null) return; // Still loading
    if (connected) {
      setPlaylistName(bandName ? `ChordMate – ${bandName}` : 'ChordMate Playlist');
      setResult(null);
      setDialogState('create');
    } else {
      setDialogState('connect');
    }
  }

  function handleConnect() {
    window.location.href = '/api/spotify/authorize';
  }

  function handleCreatePlaylist() {
    if (!playlistName.trim()) {
      toast.error('Add meg a playlist nevét');
      return;
    }
    setDialogState('creating');
    startTransition(async () => {
      try {
        const res = await createSpotifyPlaylist(playlistName.trim());
        setResult(res);
        setDialogState('success');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '';
        if (message === 'SPOTIFY_SCOPE_MISMATCH') {
          setConnected(false);
          setDialogState('connect');
          toast.error('A Spotify jogosultságok frissültek — kösd össze újra a Spotify-t');
        } else if (message === 'NO_SPOTIFY_CONNECTION') {
          setConnected(false);
          setDialogState('connect');
          toast.error('A Spotify kapcsolat lejárt, kösd össze újra');
        } else if (message === 'NO_SONGS') {
          setDialogState('closed');
          toast.error('Nincsenek dalok a listádban');
        } else if (message === 'NO_TRACKS_FOUND') {
          setDialogState('closed');
          toast.error('Egyetlen dalt sem találtam a Spotify-on');
        } else if (message === 'PLAYLIST_CREATE_FAILED') {
          setDialogState('create');
          toast.error('Nem sikerült a playlist létrehozása a Spotify-on. Ellenőrizd, hogy a fiókod hozzá van-e adva a Spotify Developer Dashboard-on.');
        } else {
          setDialogState('create');
          toast.error('Hiba a playlist létrehozásakor');
          console.error('Spotify playlist error:', err);
        }
      }
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      try {
        await disconnectSpotify();
        setConnected(false);
        setDialogState('closed');
        toast.success('Spotify fiók leválasztva');
      } catch {
        toast.error('Hiba a leválasztásnál');
      }
    });
  }

  // Don't render until we know connection status
  if (connected === null) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 text-xs h-9"
        onClick={handleButtonClick}
      >
        <SpotifyIcon className="size-4" style={{ color: connected ? SPOTIFY_GREEN : undefined }} />
        <span className="hidden sm:inline">Spotify Playlist</span>
      </Button>

      <Dialog
        open={dialogState !== 'closed'}
        onOpenChange={(open) => {
          if (!open && dialogState !== 'creating') setDialogState('closed');
        }}
      >
        <DialogContent className="max-w-[90vw] sm:max-w-md" showCloseButton={dialogState !== 'creating'}>
          {/* ── Connect Dialog ── */}
          {dialogState === 'connect' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <SpotifyIcon className="size-5" style={{ color: SPOTIFY_GREEN }} />
                  Spotify összekapcsolás
                </DialogTitle>
                <DialogDescription>
                  Kösd össze a Spotify fiókodat, hogy a dallistádból automatikusan playlistet készíthess.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3 mt-2">
                <div className="rounded-lg bg-secondary/30 p-3 text-xs text-muted-foreground space-y-1.5">
                  <p>🔒 Csak playlist létrehozási jogot kérünk</p>
                  <p>🎵 A dalaid címe és előadója alapján keresünk a Spotify-on</p>
                  <p>📋 A playlist a <strong>te Spotify fiókodban</strong> jön létre</p>
                </div>
                <Button
                  className="w-full gap-2"
                  style={{ backgroundColor: SPOTIFY_GREEN, color: '#000' }}
                  onClick={handleConnect}
                >
                  <SpotifyIcon className="size-4" />
                  Összekapcsolás a Spotify-al
                </Button>
              </div>
            </>
          )}

          {/* ── Create Playlist Dialog ── */}
          {dialogState === 'create' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <SpotifyIcon className="size-5" style={{ color: SPOTIFY_GREEN }} />
                  Spotify Playlist létrehozása
                </DialogTitle>
                <DialogDescription>
                  Az összes dalod megkeressük a Spotify-on és hozzáadjuk a playlisthez.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="playlist-name" className="text-sm font-medium">Playlist neve</Label>
                  <Input
                    id="playlist-name"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    placeholder="pl. Band Practice"
                    className="h-10"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreatePlaylist();
                    }}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs text-muted-foreground h-8"
                    onClick={() => setDialogState('disconnect')}
                  >
                    <Unplug className="size-3" />
                    Leválasztás
                  </Button>
                  <Button
                    className="gap-2"
                    style={{ backgroundColor: SPOTIFY_GREEN, color: '#000' }}
                    onClick={handleCreatePlaylist}
                    disabled={isPending || !playlistName.trim()}
                  >
                    <SpotifyIcon className="size-4" />
                    Playlist létrehozása
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* ── Creating (Progress) ── */}
          {dialogState === 'creating' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <SpotifyIcon className="size-5" style={{ color: SPOTIFY_GREEN }} />
                  Playlist létrehozása...
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <div className="relative">
                  <Loader2 className="size-10 animate-spin" style={{ color: SPOTIFY_GREEN }} />
                  <Music className="size-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium">Dalok keresése és playlist készítése...</p>
                  <p className="text-xs text-muted-foreground">Ez eltarthat néhány másodpercig</p>
                </div>
              </div>
            </>
          )}

          {/* ── Success ── */}
          {dialogState === 'success' && result && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Check className="size-5 text-green-500" />
                  Playlist elkészült!
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 mt-2">
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-center">
                  <p className="text-2xl font-bold" style={{ color: SPOTIFY_GREEN }}>
                    {result.tracksFound}/{result.tracksTotal}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    dal megtalálva a Spotify-on
                  </p>
                </div>

                {result.notFound.length > 0 && (
                  <details className="group">
                    <summary className="flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <AlertCircle className="size-3" />
                      {result.notFound.length} dal nem található
                    </summary>
                    <div className="mt-2 rounded-lg bg-secondary/30 p-2 max-h-32 overflow-y-auto">
                      {result.notFound.map((song, i) => (
                        <p key={i} className="text-xs text-muted-foreground py-0.5">
                          {song.artist} – {song.title}
                        </p>
                      ))}
                    </div>
                  </details>
                )}

                <a
                  href={result.playlistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-black transition-colors hover:opacity-90"
                  style={{ backgroundColor: SPOTIFY_GREEN }}
                >
                  <SpotifyIcon className="size-5" />
                  Megnyitás a Spotify-ban
                  <ExternalLink className="size-3.5" />
                </a>

                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setDialogState('closed')}>
                  Bezárás
                </Button>
              </div>
            </>
          )}

          {/* ── Disconnect Confirmation ── */}
          {dialogState === 'disconnect' && (
            <>
              <DialogHeader>
                <DialogTitle>Spotify leválasztása</DialogTitle>
                <DialogDescription>
                  Biztosan le akarod választani a Spotify fiókodat? Utána újra össze kell kapcsolnod, ha playlistet szeretnél készíteni.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="ghost" onClick={() => setDialogState('create')}>
                  Mégse
                </Button>
                <Button variant="destructive" onClick={handleDisconnect} disabled={isPending}>
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Leválasztás'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
