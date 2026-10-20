'use client';

import { Sheet, SheetClose, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useTools } from './tools-launcher';
import { MetronomeIcon, TunerIcon } from './tool-icons';

export function ToolsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const tools = useTools();
  const items = [
    { id: 'tuner' as const, label: 'Hangoló', hint: 'Mikrofonos gitárhangoló', Icon: TunerIcon },
    { id: 'metronome' as const, label: 'Metronóm', hint: 'Tempó és ütem', Icon: MetronomeIcon },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle>Eszközök</SheetTitle>
        <div className="flex flex-col">
          {items.map(({ id, label, hint, Icon }) => (
            <SheetClose
              key={id}
              onClick={() => tools.open(id)}
              className="flex min-h-14 items-center gap-4 border-t border-border py-3 text-left first:border-t-0"
            >
              <span className="grid size-10 place-items-center rounded-full bg-primary/12 text-primary-text">
                <Icon className="size-5" />
              </span>
              <span className="flex flex-col">
                <span className="text-[15px] font-semibold">{label}</span>
                <span className="text-[13px] text-muted-foreground">{hint}</span>
              </span>
            </SheetClose>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
