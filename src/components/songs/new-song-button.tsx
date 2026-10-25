'use client';

import { PendingLink } from '@/components/shared/pending-link';
import { Plus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button-variants';
import { cn } from '@/lib/utils';

export function NewSongButton() {
  return (
    <PendingLink href="/songs/new" className={cn(buttonVariants({ className: "gap-2" }))}>
      <Plus className="size-4" />
      Új dal
    </PendingLink>
  );
}
