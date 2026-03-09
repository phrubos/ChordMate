'use client';

import YouTube from 'react-youtube';
import { extractYoutubeId } from '@/lib/utils';

interface YouTubePlayerProps {
  url: string;
  compact?: boolean;
  autoplay?: boolean;
}

export function YouTubePlayer({ url, compact = false, autoplay = false }: YouTubePlayerProps) {
  const videoId = extractYoutubeId(url);

  if (!videoId) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed bg-muted p-4 text-sm text-muted-foreground">
        Érvénytelen YouTube link
      </div>
    );
  }

  if (compact) {
    return (
      <div className="relative aspect-video w-full max-w-[200px] overflow-hidden rounded-lg">
        <YouTube
          videoId={videoId}
          opts={{
            width: '100%',
            height: '100%',
            playerVars: { autoplay: 0, modestbranding: 1 },
          }}
          className="absolute inset-0"
          iframeClassName="w-full h-full"
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg">
      <YouTube
        videoId={videoId}
        opts={{
          width: '100%',
          height: '100%',
          playerVars: { autoplay: autoplay ? 1 : 0, modestbranding: 1 },
        }}
        className="absolute inset-0"
        iframeClassName="w-full h-full"
      />
    </div>
  );
}
