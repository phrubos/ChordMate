'use client';

import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const TAB_SIZE_MIN = 11;
export const TAB_SIZE_MAX = 32;

/** − size + for the tab's font size. */
export function TabSizeControl({ size, onChange }: { size: number; onChange: (size: number) => void }) {
  return (
    <span className="inline-flex items-center" role="group" aria-label="Tab betűmérete">
      <Button variant="ghost" size="icon-sm" aria-label="Kisebb betű" disabled={size <= TAB_SIZE_MIN} onClick={() => onChange(Math.max(TAB_SIZE_MIN, size - 1))}>
        <Minus />
      </Button>
      <span className="w-6 text-center font-mono text-[13px] text-muted-foreground tabular-nums">{size}</span>
      <Button variant="ghost" size="icon-sm" aria-label="Nagyobb betű" disabled={size >= TAB_SIZE_MAX} onClick={() => onChange(Math.min(TAB_SIZE_MAX, size + 1))}>
        <Plus />
      </Button>
    </span>
  );
}
