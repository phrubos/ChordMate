'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function NewSongButton() {
  return (
    <Link href="/songs/new" className={cn(buttonVariants({ className: "gap-2" }))}>
      <Plus className="size-4" />
      Új dal
    </Link>
  );
}
