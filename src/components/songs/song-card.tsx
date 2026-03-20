'use client';

import Link from 'next/link';
import { Pencil, Trash2, Play, Star, FileText, Music, Heart } from 'lucide-react';
import { ImageLightbox } from '@/components/shared/image-lightbox';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SongWithUser } from '@/types';
import { formatRelativeDate } from '@/lib/utils';
import { ExpandableText } from '@/components/shared/expandable-text';
import { memo, useState, useTransition } from 'react';
import { toggleFavorite } from '@/actions/songs';
import dynamic from 'next/dynamic';
import { DeleteSongDialog } from './delete-song-dialog';

const TabViewerModal = dynamic(() => import('./tab-viewer-modal').then(m => ({ default: m.TabViewerModal })), { ssr: false });
import { TruncatedText } from '@/components/shared/truncated-text';

interface SongCardProps {
  song: SongWithUser;
  onPlay?: (song: SongWithUser) => void;
}

const DifficultyStars = memo(function DifficultyStars({ level }: { level: number | null }) {
  if (!level) return null;
  const colors = ['text-green-500', 'text-lime-500', 'text-yellow-500', 'text-orange-500', 'text-red-500'];
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${i < level ? colors[level - 1] + ' fill-current' : 'text-muted-foreground/20'}`}
        />
      ))}
    </div>
  );
});

export const SongCard = memo(function SongCard({ song, onPlay }: SongCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isFav, setIsFav] = useState(song.isFavorite);
  const [, startTransition] = useTransition();

  return (
    <>
      <div className="group relative rounded-xl border border-border/80 bg-card/70 p-4 shadow-sm transition-all hover:border-border hover:bg-card hover:shadow-md hover:shadow-primary/5 overflow-hidden h-full flex flex-col">
        {/* Header with album art */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-secondary/50">
            {song.imageUrl ? (
              <ImageLightbox
                src={song.imageUrl}
                alt={`${song.artist} - ${song.title}`}
                width={56}
                height={56}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <Music className="size-6 text-muted-foreground/30" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold leading-tight">
                  <ExpandableText className="block" clampClassName="truncate">{song.title}</ExpandableText>
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  <ExpandableText className="block" clampClassName="truncate">{song.artist}</ExpandableText>
                </p>
              </div>
              <DifficultyStars level={song.difficulty} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 min-w-0">
              <TruncatedText className="text-xs text-muted-foreground min-w-0 max-w-full shrink">
                {`${song.addedBy?.name ?? 'Ismeretlen'} · ${formatRelativeDate(song.createdAt)}`}
              </TruncatedText>
              {song.tabContent && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[11px] font-medium bg-primary/15 text-primary border-0 shrink-0">
                  TAB
                </Badge>
              )}
            </div>
          </div>
        </div>

        {song.notes && (
          <p className="mt-2 text-sm text-muted-foreground italic">
            <ExpandableText className="block" clampClassName="line-clamp-2">{song.notes}</ExpandableText>
          </p>
        )}

        {/* Actions */}
        <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-border/50 pt-3 opacity-100 transition-opacity hover-device:opacity-0 hover-device:group-hover:opacity-100">
          {onPlay && song.youtubeUrl && (
            <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-3" onClick={() => onPlay(song)}>
              <Play className="size-3.5" />
              <span className="hidden sm:inline">Lejátszás</span>
            </Button>
          )}
          <TabViewerModal
            songTitle={song.title}
            artist={song.artist}
            tabContent={song.tabContent}
            tabUrl={song.tabUrl}
            trigger={
              <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-3 text-muted-foreground">
                <FileText className="size-3.5" />
                <span className="hidden sm:inline">Tab</span>
              </Button>
            }
          />
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            className={`h-9 w-9 p-0 ${isFav ? 'text-pink-500' : 'text-muted-foreground'}`}
            onClick={() => {
              setIsFav(!isFav);
              startTransition(() => toggleFavorite(song.id));
            }}
          >
            <Heart className={`size-3.5 ${isFav ? 'fill-current' : ''}`} />
          </Button>
          <Link href={`/songs/${song.id}/edit`} className={buttonVariants({ variant: "ghost", size: "sm", className: "h-9 w-9 p-0 text-muted-foreground" })}>
            <Pencil className="size-3.5" />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-destructive/70 hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      <DeleteSongDialog
        song={song}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
});
