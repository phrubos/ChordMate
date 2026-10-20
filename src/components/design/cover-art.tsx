import Image from 'next/image';
import { cn } from '@/lib/utils';
import { hueFromString } from '@/lib/song-meta';

type CoverSize = 'xs' | 'sm' | 'md' | 'lg' | 'fill';

const SIZE: Record<CoverSize, { box: string; px: number; title: string }> = {
  xs: { box: 'size-8', px: 32, title: '' },
  sm: { box: 'size-10', px: 40, title: '' },
  md: { box: 'size-14', px: 56, title: '' },
  lg: { box: 'size-[232px]', px: 232, title: 'text-[38px]' },
  fill: { box: 'size-full', px: 400, title: 'text-[clamp(14px,11cqi,26px)]' },
};

const PATTERNS = [
  'repeating-radial-gradient(circle at 70% 30%, transparent 0 7px, rgb(255 255 255 / .08) 7px 8px)',
  'repeating-linear-gradient(-35deg, transparent 0 10px, rgb(0 0 0 / .14) 10px 18px)',
  'radial-gradient(circle at 30% 75%, oklch(.85 .12 calc(var(--h) - 30) / .75) 0 26%, transparent 27%)',
  'linear-gradient(transparent 55%, rgb(0 0 0 / .35) 55% 58%, transparent 58%), linear-gradient(90deg, transparent 62%, rgb(255 255 255 / .12) 62% 64%, transparent 64%)',
];

interface CoverArtProps {
  title: string;
  artist: string;
  imageUrl?: string | null;
  size: CoverSize;
  showType?: boolean;
  className?: string;
}

/** Album art, or a deterministic generated cover with Liner-style typography. */
export function CoverArt({ title, artist, imageUrl, size, showType, className }: CoverArtProps) {
  const s = SIZE[size];
  const hue = hueFromString(`${artist} — ${title}`);
  const base = cn('relative shrink-0 overflow-hidden rounded-[2px]', s.box, className);

  if (imageUrl) {
    return (
      <div className={base}>
        <Image src={imageUrl} alt="" fill sizes={`${s.px}px`} className="object-cover" />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className={cn(base, '@container')}
      style={{
        ['--h' as string]: hue,
        backgroundImage: `${PATTERNS[hue % 4]}, linear-gradient(180deg, rgb(255 255 255 / .1), transparent 40%), linear-gradient(140deg, oklch(.7 .15 ${hue}), oklch(.46 .1 ${hue + 40}))`,
      }}
    >
      {showType && s.title && (
        <>
          <span className="absolute top-3 left-3.5 font-mono text-[10.5px] tracking-[0.12em] text-white/85 uppercase @max-[150px]:hidden">{artist}</span>
          <span
            className={cn(
              'display-soft absolute right-3.5 bottom-3 left-3.5 line-clamp-3 font-display @max-[150px]:right-2 @max-[150px]:bottom-2 @max-[150px]:left-2 leading-[0.98] font-normal tracking-[-0.02em] text-balance text-white italic',
              s.title
            )}
          >
            {title}
          </span>
        </>
      )}
    </div>
  );
}
