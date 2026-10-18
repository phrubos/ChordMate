import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { hueFromString } from '@/lib/song-meta';
import { cn } from '@/lib/utils';

export interface StackUser {
  name: string | null;
  image: string | null;
}

/** Single initial of the given name (last word — Hungarian names are family-name first). */
export function initialsOf(name: string | null): string {
  const words = (name ?? '').split(' ').filter(Boolean);
  return words.length ? words[words.length - 1][0].toUpperCase() : '?';
}

export function AvatarStack({ users, max = 4, className }: { users: StackUser[]; max?: number; className?: string }) {
  const shown = users.slice(0, max);
  const rest = users.length - shown.length;
  return (
    <div className={cn('flex', className)}>
      {shown.map((u, i) => (
        <Avatar key={`${u.name}-${i}`} className={cn('size-8 ring-[3px] ring-background', i > 0 && '-ml-2')} title={u.name ?? undefined}>
          {u.image && <AvatarImage src={u.image} alt={u.name ?? ''} />}
          <AvatarFallback
            className="text-[13px] font-bold text-white"
            style={{ backgroundColor: `oklch(.58 .12 ${hueFromString(u.name ?? '')})` }}
          >
            {initialsOf(u.name)}
          </AvatarFallback>
        </Avatar>
      ))}
      {rest > 0 && (
        <span className="-ml-2 inline-grid size-8 place-items-center rounded-full bg-muted font-mono text-xs ring-[3px] ring-background">+{rest}</span>
      )}
    </div>
  );
}
